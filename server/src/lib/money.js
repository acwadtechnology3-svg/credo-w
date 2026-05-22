/** Round to 2 decimal places for DECIMAL / wallet arithmetic */
export function roundMoney(value) {
  return Math.round(parseFloat(value) * 100) / 100
}
