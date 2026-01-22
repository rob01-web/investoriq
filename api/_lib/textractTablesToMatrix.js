const getCellText = (cell, blocksById) => {
  const rel = (cell.Relationships || []).find((item) => item.Type === "CHILD");
  if (!rel || !rel.Ids) return "";
  const tokens = rel.Ids
    .map((id) => blocksById.get(id))
    .filter((block) => block)
    .flatMap((block) => {
      if (block.BlockType === "WORD") {
        return block.Text || "";
      }
      if (block.BlockType === "SELECTION_ELEMENT") {
        return block.SelectionStatus === "SELECTED" ? "Yes" : "";
      }
      return "";
    })
    .filter((text) => text);
  return tokens.join(" ").trim();
};

const normalizeGrid = (rows, confs, maxRow, maxCol) => {
  const normalizedRows = [];
  const normalizedConf = [];

  for (let r = 0; r < maxRow; r += 1) {
    const row = rows[r] || [];
    const confRow = confs[r] || [];
    const outRow = [];
    const outConf = [];
    for (let c = 0; c < maxCol; c += 1) {
      outRow[c] = row[c] ?? "";
      outConf[c] = confRow[c] ?? null;
    }
    normalizedRows.push(outRow);
    normalizedConf.push(outConf);
  }

  return { rows: normalizedRows, confidenceByCell: normalizedConf };
};

export const textractTablesToMatrix = (blocks) => {
  const tables = [];
  if (!Array.isArray(blocks)) {
    return { tables };
  }

  const blocksById = new Map();
  for (const block of blocks) {
    if (block && block.Id) {
      blocksById.set(block.Id, block);
    }
  }

  for (const block of blocks) {
    if (!block || block.BlockType !== "TABLE") continue;

    const cellIds =
      (block.Relationships || [])
        .filter((rel) => rel.Type === "CHILD")
        .flatMap((rel) => rel.Ids || []) || [];

    const rows = [];
    const confs = [];
    let maxRow = 0;
    let maxCol = 0;

    for (const cellId of cellIds) {
      const cell = blocksById.get(cellId);
      if (!cell || cell.BlockType !== "CELL") continue;

      const rowIndex = Number(cell.RowIndex || 0);
      const colIndex = Number(cell.ColumnIndex || 0);
      if (rowIndex < 1 || colIndex < 1) continue;

      const rowPos = rowIndex - 1;
      const colPos = colIndex - 1;
      if (!rows[rowPos]) rows[rowPos] = [];
      if (!confs[rowPos]) confs[rowPos] = [];

      rows[rowPos][colPos] = getCellText(cell, blocksById);
      confs[rowPos][colPos] =
        typeof cell.Confidence === "number" ? cell.Confidence : null;

      if (rowIndex > maxRow) maxRow = rowIndex;
      if (colIndex > maxCol) maxCol = colIndex;
    }

    tables.push(normalizeGrid(rows, confs, maxRow, maxCol));
  }

  return { tables };
};
