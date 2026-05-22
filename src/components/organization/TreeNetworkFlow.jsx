import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Focus, RefreshCw } from 'lucide-react'
import { getTreeFlow, searchTreeMembers } from '../../api/organization.api'
import MemberTreeNode from './MemberTreeNode'
import GlowEdge from './GlowEdge'
import TreeMemberPanel from './TreeMemberPanel'

const nodeTypes = { memberNode: MemberTreeNode }
const edgeTypes = { glow: GlowEdge }

function TreeNetworkFlowInner({ focusUserId = null }) {
  const qc = useQueryClient()
  const [selectedMember, setSelectedMember] = useState(null)
  const [searchQ, setSearchQ] = useState('')
  const [focusMode, setFocusMode] = useState(false)
  const [expanded, setExpanded] = useState([])

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['tree-flow', expanded.join(',')],
    queryFn: () => getTreeFlow({ depth: focusMode ? 3 : 5, expanded: expanded.join(',') }),
  })

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    if (data?.nodes) setNodes(data.nodes)
    if (data?.edges) setEdges(data.edges)
  }, [data, setNodes, setEdges])

  const onNodeClick = useCallback((_, node) => {
    setSelectedMember(node.data)
    if (node.data?.treeNodeId && !expanded.includes(node.data.treeNodeId)) {
      setExpanded((prev) => [...prev, node.data.treeNodeId])
      qc.invalidateQueries({ queryKey: ['tree-flow'] })
    }
  }, [expanded, qc])

  const handleSearch = async () => {
    if (searchQ.length < 2) return
    const { results } = await searchTreeMembers(searchQ)
    if (results?.[0]) setSelectedMember(results[0])
  }

  return (
    <div className="org-tree-flow-wrap">
      <div className="org-tree-toolbar" dir="rtl">
        <div className="org-tree-search">
          <Search size={16} />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="بحث عضو..."
          />
        </div>
        <button
          type="button"
          className={`org-tree-tool${focusMode ? ' active' : ''}`}
          onClick={() => setFocusMode((f) => !f)}
          title="وضع التركيز"
        >
          <Focus size={16} />
        </button>
        <button type="button" className="org-tree-tool" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={16} className={isFetching ? 'spin' : ''} />
        </button>
      </div>

      {isLoading ? (
        <div className="org-tree-loading">جاري بناء الشجرة الحية...</div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          className="org-react-flow"
        >
          <Background color="rgba(123,108,246,0.12)" gap={20} />
          <Controls showInteractive />
          <MiniMap
            nodeColor={(n) => (n.data?.isYou ? '#7B6CF6' : '#1F2342')}
            maskColor="rgba(5,6,13,0.8)"
            className="org-minimap"
          />
          <Panel position="top-left">
            <span className="org-tree-hint">اسحب · قرّب · انقر للتوسيع</span>
          </Panel>
        </ReactFlow>
      )}

      {selectedMember && (
        <TreeMemberPanel member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  )
}

export default function TreeNetworkFlow(props) {
  return (
    <ReactFlowProvider>
      <TreeNetworkFlowInner {...props} />
    </ReactFlowProvider>
  )
}
