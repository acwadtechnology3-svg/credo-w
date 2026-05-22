import { supabase } from '../lib/supabase.js'

export const marketingController = {
  async getAssets(req, res) {
    try {
      const { type, language, region } = req.query
      let query = supabase
        .from('marketing_assets')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (type) query = query.eq('type', type)
      if (language) query = query.eq('language', language)
      if (region) query = query.eq('region', region)

      const { data, error } = await query
      if (error) throw error
      return res.json(data || [])
    } catch (err) {
      console.error('getAssets error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async createAsset(req, res) {
    try {
      const { title, type, language, region, file_url, thumbnail_url } = req.body
      const { data, error } = await supabase
        .from('marketing_assets')
        .insert({ title, type, language, region, file_url, thumbnail_url })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json(data)
    } catch (err) {
      console.error('createAsset error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async deleteAsset(req, res) {
    try {
      await supabase.from('marketing_assets').update({ is_active: false }).eq('id', req.params.id)
      return res.json({ message: 'Asset removed' })
    } catch (err) {
      console.error('deleteAsset error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  },
}
