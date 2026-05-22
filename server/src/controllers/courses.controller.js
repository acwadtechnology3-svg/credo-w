import { supabase } from '../lib/supabase.js'
import { pearlsService } from '../services/pearls.service.js'

const MARKETER_ROLES = ['ambassador', 'franchise', 'admin', 'super_admin']

export const coursesController = {
  async getCategories(req, res) {
    try {
      const { data, error } = await supabase
        .from('course_categories')
        .select('*')
        .order('sort_order')
      if (error) throw error
      return res.json(data || [])
    } catch (err) {
      console.error('getCategories error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getAllCourses(req, res) {
    try {
      const { category_id, level, search, page = 1, limit = 12, exclude_invited } = req.query
      const offset = (Number(page) - 1) * Number(limit)
      let query = supabase
        .from('courses')
        .select(
          'id, title, slug, short_description, thumbnail_url, price_egp, is_free, level, duration_hours, lessons_count, enrolled_count, rating_avg, instructor_name, access_type, required_rank_id, course_categories(name), ranks:required_rank_id(name)',
          { count: 'exact' }
        )
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit, 10) - 1)
      if (category_id) query = query.eq('category_id', category_id)
      if (level) query = query.eq('level', level)
      if (search) query = query.ilike('title', `%${search}%`)
      if (exclude_invited === 'true') query = query.neq('access_type', 'invited_only')
      const { data, count, error } = await query
      if (error) throw error
      return res.json({ data: data || [], total: count })
    } catch (err) {
      console.error('getAllCourses error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getCourse(req, res) {
    try {
      const { id } = req.params
      const { data: course, error } = await supabase
        .from('courses')
        .select(
          '*, course_categories(name), ranks:required_rank_id(name), course_sections(id, title, sort_order, lessons(id, title, content_type, duration_minutes, sort_order, is_free_preview))'
        )
        .eq('id', id)
        .eq('status', 'published')
        .single()
      if (error || !course) return res.status(404).json({ error: 'Course not found' })

      let enrollment = null
      if (req.user?.userId) {
        const { data } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('course_id', id)
          .eq('user_id', req.user.userId)
          .maybeSingle()
        enrollment = data
      }

      if (course.access_type === 'invited_only' && !enrollment) {
        return res.status(404).json({ error: 'Course not found' })
      }

      const { data: reviews } = await supabase
        .from('course_reviews')
        .select('rating, comment, created_at, users(username)')
        .eq('course_id', id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10)

      return res.json({ ...course, enrollment, reviews: reviews || [] })
    } catch (err) {
      console.error('getCourse error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async enrollCourse(req, res) {
    try {
      const userId = req.user.userId
      const { course_id } = req.body

      const { data: course, error: courseErr } = await supabase
        .from('courses')
        .select('id, price_egp, is_free, title, access_type, required_rank_id, status')
        .eq('id', course_id)
        .single()
      if (courseErr || !course) return res.status(404).json({ error: 'Course not found' })
      if (course.status !== 'published') {
        return res.status(400).json({ error: 'Course is not available for enrollment' })
      }

      const { data: user, error: userErr } = await supabase
        .from('users')
        .select('role, rank_id, ranks(sort_order)')
        .eq('id', userId)
        .single()
      if (userErr) throw userErr

      if (course.access_type === 'marketers_only') {
        if (!MARKETER_ROLES.includes(user?.role)) {
          return res.status(403).json({ error: 'This course is for marketers only' })
        }
      }

      if (course.access_type === 'invited_only') {
        return res.status(403).json({ error: 'This course requires an invitation from admin' })
      }

      if (course.access_type === 'rank_required' && course.required_rank_id) {
        const { data: requiredRank } = await supabase
          .from('ranks')
          .select('sort_order')
          .eq('id', course.required_rank_id)
          .single()
        const userSort = user?.ranks?.sort_order ?? 0
        const requiredSort = requiredRank?.sort_order ?? 0
        if (userSort < requiredSort) {
          return res.status(403).json({ error: 'Your current rank does not qualify for this course' })
        }
      }

      const { data: existing } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', course_id)
        .eq('user_id', userId)
        .maybeSingle()
      if (existing) return res.status(409).json({ error: 'Already enrolled' })

      if (!course.is_free && parseFloat(course.price_egp) > 0) {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', userId)
          .eq('type', 'CMONEY')
          .single()
        if (parseFloat(wallet?.balance || 0) < parseFloat(course.price_egp)) {
          return res.status(400).json({ error: 'Insufficient C Money balance' })
        }
        const { walletService } = await import('../services/wallet.service.js')
        await walletService.credit(
          userId,
          'CMONEY',
          -parseFloat(course.price_egp),
          'PURCHASE',
          `Course: ${course.title}`
        )
      }

      const { data: enrollment, error } = await supabase
        .from('course_enrollments')
        .insert({ course_id, user_id: userId })
        .select()
        .single()
      if (error) throw error

      await supabase.rpc('update_course_stats', { p_course_id: course_id })

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'COURSE_ENROLLED',
        title: 'Enrolled successfully!',
        body: `You are now enrolled in "${course.title}". Start learning now!`,
      })

      return res.status(201).json({ message: 'Enrolled successfully', enrollment })
    } catch (err) {
      console.error('enrollCourse error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getMyEnrollments(req, res) {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(
          '*, courses(id, title, thumbnail_url, lessons_count, instructor_name, duration_hours)'
        )
        .eq('user_id', req.user.userId)
        .order('enrolled_at', { ascending: false })
      if (error) throw error
      return res.json(data || [])
    } catch (err) {
      console.error('getMyEnrollments error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async getCourseContent(req, res) {
    try {
      const { course_id } = req.params
      const userId = req.user.userId

      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', course_id)
        .eq('user_id', userId)
        .single()
      if (!enrollment) return res.status(403).json({ error: 'Not enrolled in this course' })

      const { data: sections, error: secErr } = await supabase
        .from('course_sections')
        .select(
          '*, lessons(id, title, content_type, video_url, pdf_url, text_content, duration_minutes, sort_order, is_free_preview)'
        )
        .eq('course_id', course_id)
        .order('sort_order')
      if (secErr) throw secErr

      const { data: progress, error: progErr } = await supabase
        .from('lesson_progress')
        .select('lesson_id, is_completed, watched_seconds')
        .eq('enrollment_id', enrollment.id)
      if (progErr) throw progErr

      const progressMap = {}
      ;(progress || []).forEach((p) => {
        progressMap[p.lesson_id] = p
      })

      return res.json({ enrollment, sections: sections || [], progressMap })
    } catch (err) {
      console.error('getCourseContent error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async updateLessonProgress(req, res) {
    try {
      const { course_id, lesson_id } = req.params
      const { watched_seconds, is_completed } = req.body
      const userId = req.user.userId

      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id, certificate_url')
        .eq('course_id', course_id)
        .eq('user_id', userId)
        .single()
      if (!enrollment) return res.status(403).json({ error: 'Not enrolled' })

      const { error: upsertErr } = await supabase.from('lesson_progress').upsert(
        {
          enrollment_id: enrollment.id,
          lesson_id,
          user_id: userId,
          watched_seconds: watched_seconds || 0,
          is_completed: !!is_completed,
          completed_at: is_completed ? new Date().toISOString() : null,
        },
        { onConflict: 'enrollment_id,lesson_id' }
      )
      if (upsertErr) throw upsertErr

      if (is_completed) {
        try {
          await pearlsService.triggerMission(userId, 'lesson_complete')
        } catch {
          /* optional */
        }
      }

      const { count: totalLessons } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course_id)
      const { count: completedLessons } = await supabase
        .from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('enrollment_id', enrollment.id)
        .eq('is_completed', true)

      const pct =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

      await supabase
        .from('course_enrollments')
        .update({
          completion_pct: pct,
          completed_at: pct === 100 ? new Date().toISOString() : null,
        })
        .eq('id', enrollment.id)

      if (pct === 100 && !enrollment.certificate_url) {
        const certUrl = `/certificates/${enrollment.id}`
        await supabase
          .from('course_enrollments')
          .update({ certificate_url: certUrl })
          .eq('id', enrollment.id)
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'CERTIFICATE',
          title: '🎓 Course Completed!',
          body: 'Congratulations! You have completed the course and earned your certificate.',
        })
        try {
          await pearlsService.earn(userId, 'course_complete', 150, { course_id })
        } catch {
          /* optional */
        }
      }

      return res.json({ completion_pct: pct, message: 'Progress updated' })
    } catch (err) {
      console.error('updateLessonProgress error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async submitReview(req, res) {
    try {
      const { course_id, rating, comment } = req.body
      const userId = req.user.userId

      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', course_id)
        .eq('user_id', userId)
        .single()
      if (!enrollment) return res.status(403).json({ error: 'Must be enrolled to review' })

      const { data, error } = await supabase
        .from('course_reviews')
        .upsert(
          {
            course_id,
            user_id: userId,
            enrollment_id: enrollment.id,
            rating,
            comment,
          },
          { onConflict: 'course_id,user_id' }
        )
        .select()
        .single()
      if (error) throw error

      await supabase.rpc('update_course_stats', { p_course_id: course_id })
      return res.json(data)
    } catch (err) {
      console.error('submitReview error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async adminGetCourses(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query
      const offset = (Number(page) - 1) * Number(limit)
      let query = supabase
        .from('courses')
        .select(
          'id, title, status, price_egp, is_free, enrolled_count, rating_avg, lessons_count, access_type, created_at, course_categories(name)',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit, 10) - 1)
      if (status) query = query.eq('status', status)
      const { data, count, error } = await query
      if (error) throw error
      return res.json({ data: data || [], total: count })
    } catch (err) {
      console.error('adminGetCourses error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async adminGetCourse(req, res) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*, course_categories(name), course_sections(*, lessons(*))')
        .eq('id', req.params.id)
        .single()
      if (error || !data) return res.status(404).json({ error: 'Not found' })
      return res.json(data)
    } catch (err) {
      console.error('adminGetCourse error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async adminCreateCourse(req, res) {
    try {
      const slug =
        req.body.title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') +
        '-' +
        Date.now()
      const { data, error } = await supabase
        .from('courses')
        .insert({ ...req.body, slug, created_by: req.user.userId })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json(data)
    } catch (err) {
      console.error('adminCreateCourse error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async adminUpdateCourse(req, res) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    } catch (err) {
      console.error('adminUpdateCourse error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async adminDeleteCourse(req, res) {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ status: 'archived' })
        .eq('id', req.params.id)
      if (error) throw error
      return res.json({ message: 'Course archived' })
    } catch (err) {
      console.error('adminDeleteCourse error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async adminCreateSection(req, res) {
    try {
      const { course_id, title, sort_order } = req.body
      const { data, error } = await supabase
        .from('course_sections')
        .insert({ course_id, title, sort_order: sort_order || 0 })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json(data)
    } catch (err) {
      console.error('adminCreateSection error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async adminUpdateSection(req, res) {
    try {
      const { data, error } = await supabase
        .from('course_sections')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    } catch (err) {
      console.error('adminUpdateSection error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async adminDeleteSection(req, res) {
    try {
      const { error } = await supabase.from('course_sections').delete().eq('id', req.params.id)
      if (error) throw error
      return res.json({ message: 'Section deleted' })
    } catch (err) {
      console.error('adminDeleteSection error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async adminCreateLesson(req, res) {
    try {
      const { data, error } = await supabase.from('lessons').insert(req.body).select().single()
      if (error) throw error
      await supabase.rpc('update_course_stats', { p_course_id: req.body.course_id })
      return res.status(201).json(data)
    } catch (err) {
      console.error('adminCreateLesson error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async adminUpdateLesson(req, res) {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    } catch (err) {
      console.error('adminUpdateLesson error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async adminDeleteLesson(req, res) {
    try {
      const { data: lesson } = await supabase
        .from('lessons')
        .select('course_id')
        .eq('id', req.params.id)
        .single()
      const { error } = await supabase.from('lessons').delete().eq('id', req.params.id)
      if (error) throw error
      if (lesson?.course_id) {
        await supabase.rpc('update_course_stats', { p_course_id: lesson.course_id })
      }
      return res.json({ message: 'Lesson deleted' })
    } catch (err) {
      console.error('adminDeleteLesson error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async adminGrantAccess(req, res) {
    try {
      const { user_id, course_id } = req.body
      const { data: existing } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', course_id)
        .eq('user_id', user_id)
        .maybeSingle()
      if (existing) return res.status(409).json({ error: 'User already enrolled' })
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert({ course_id, user_id })
        .select()
        .single()
      if (error) throw error
      await supabase.rpc('update_course_stats', { p_course_id: course_id })
      return res.status(201).json({ message: 'Access granted', enrollment: data })
    } catch (err) {
      console.error('adminGrantAccess error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async adminGetEnrollments(req, res) {
    try {
      const { course_id, page = 1 } = req.query
      const offset = (Number(page) - 1) * 20
      let query = supabase
        .from('course_enrollments')
        .select('*, users(username, full_name, email), courses(title)', { count: 'exact' })
        .order('enrolled_at', { ascending: false })
        .range(offset, offset + 19)
      if (course_id) query = query.eq('course_id', course_id)
      const { data, count, error } = await query
      if (error) throw error
      return res.json({ data: data || [], total: count })
    } catch (err) {
      console.error('adminGetEnrollments error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
