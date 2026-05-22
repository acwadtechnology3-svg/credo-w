const W = 1200
const H = 620
const NODE_HALF_H = 28

/** @returns {{ nodes: object[], lines: object[], width: number, height: number }} */
export function layoutPlacementTree(tree) {
  const nodes = []
  const lines = []

  const place = (node, depth, x0, x1, parent = null, branchSide = null) => {
    if (!node) return
    const x = (x0 + x1) / 2
    const y = 50 + depth * 130
    nodes.push({ ...node, x, y, depth, branchSide })
    if (parent) {
      lines.push({
        x1: parent.x,
        y1: parent.y + NODE_HALF_H - 2,
        x2: x,
        y2: y - NODE_HALF_H + 2,
        side: branchSide,
        active: node.status === 'active',
      })
    }
    const cur = { x, y }
    if (node.left) place(node.left, depth + 1, x0, x, cur, 'L')
    if (node.right) place(node.right, depth + 1, x, x1, cur, 'R')
  }

  place(tree, 0, 0, W)
  return { nodes, lines, width: W, height: H }
}
