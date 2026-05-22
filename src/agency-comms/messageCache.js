/** Instant chat — patch React Query cache without refetch */

export function messagesQueryKey(agencyId, channelId) {
  return ['agency-group-messages', agencyId, channelId]
}

function normalizeIncoming(raw) {
  return raw?.message || raw
}

export function appendMessageToThread(qc, agencyId, channelId, incoming) {
  if (!agencyId || !channelId || !incoming) return
  const msg = normalizeIncoming(incoming)
  if (!msg?.id && !msg?._optimistic) return

  qc.setQueryData(messagesQueryKey(agencyId, channelId), (old) => {
    if (!old) return old
    const list = [...(old.messages || [])]

    if (msg.id && list.some((m) => m.id === msg.id)) return old

    const optIdx = list.findIndex(
      (m) =>
        m._optimistic &&
        m.sender_id === msg.sender_id &&
        (m.body === msg.body || m._client_id === msg._client_id)
    )
    if (optIdx >= 0) {
      list[optIdx] = {
        ...msg,
        sender: msg.sender || list[optIdx].sender,
        _optimistic: false,
      }
      return { ...old, messages: list }
    }

    list.push(msg)
    return { ...old, messages: list }
  })
}

export function addOptimisticMessage(qc, agencyId, channelId, optimisticMsg) {
  qc.setQueryData(messagesQueryKey(agencyId, channelId), (old) => {
    if (!old) {
      return {
        messages: [optimisticMsg],
        channel: null,
        can_see_deleted: false,
      }
    }
    return { ...old, messages: [...(old.messages || []), optimisticMsg] }
  })
}

export function removeOptimisticMessage(qc, agencyId, channelId, clientId) {
  qc.setQueryData(messagesQueryKey(agencyId, channelId), (old) => {
    if (!old) return old
    return {
      ...old,
      messages: (old.messages || []).filter((m) => m._client_id !== clientId),
    }
  })
}

export function patchMessageDeleted(qc, agencyId, channelId, messageId, patch) {
  qc.setQueryData(messagesQueryKey(agencyId, channelId), (old) => {
    if (!old) return old
    if (patch.scope === 'self') {
      return {
        ...old,
        messages: (old.messages || []).filter((m) => m.id !== messageId),
      }
    }
    return {
      ...old,
      messages: (old.messages || []).map((m) => {
        if (m.id !== messageId) return m
        return {
          ...m,
          deleted_placeholder: true,
          deleted_label: patch.deleted_label,
          body: null,
          deleted_for_all_at: patch.deleted_for_all_at || new Date().toISOString(),
        }
      }),
    }
  })
}
