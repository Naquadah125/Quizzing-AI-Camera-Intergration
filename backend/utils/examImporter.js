const xlsx = require('xlsx');

const parseExamFile = (fileBuffer, originalname) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  const validQuestions = [];
  const errors = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;

    const normalizedRow = {};
    Object.keys(row).forEach((key) => {
      normalizedRow[key.trim().toLowerCase()] = String(row[key]).trim();
    });

    const questionText =
      normalizedRow['câu hỏi'] ||
      normalizedRow['cau hoi'] ||
      normalizedRow['question'] ||
      normalizedRow['noi dung'];

    const optA = normalizedRow['đáp án a'] || normalizedRow['dap an a'] || normalizedRow['a'] || normalizedRow['option a'];
    const optB = normalizedRow['đáp án b'] || normalizedRow['dap an b'] || normalizedRow['b'] || normalizedRow['option b'];
    const optC = normalizedRow['đáp án c'] || normalizedRow['dap an c'] || normalizedRow['c'] || normalizedRow['option c'];
    const optD = normalizedRow['đáp án d'] || normalizedRow['dap an d'] || normalizedRow['d'] || normalizedRow['option d'];

    const rawCorrect = (
      normalizedRow['đáp án đúng'] ||
      normalizedRow['dap an dung'] ||
      normalizedRow['correct'] ||
      normalizedRow['correct answer']
    )?.toUpperCase();

    const pinD =
      normalizedRow['ghim đáp án d'] ||
      normalizedRow['ghim d'] ||
      normalizedRow['pin d'] ||
      normalizedRow['is_pinned_d'];

    const points = parseFloat(normalizedRow['điểm'] || normalizedRow['diem'] || normalizedRow['points'] || 1);
    const explanation = normalizedRow['giải thích'] || normalizedRow['giai thich'] || normalizedRow['explanation'] || '';

    const rowErrors = [];

    if (!questionText) {
      rowErrors.push('Thiếu nội dung câu hỏi');
    }
    if (!optA || !optB || !optC || !optD) {
      rowErrors.push('Phải có đầy đủ 4 đáp án (A, B, C, D)');
    }
    if (!['A', 'B', 'C', 'D'].includes(rawCorrect)) {
      rowErrors.push(`Đáp án đúng '${rawCorrect}' không hợp lệ (phải là A, B, C, hoặc D)`);
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowNumber,
        questionText: questionText || '(Trống)',
        errors: rowErrors,
      });
    } else {
      // Auto-pin option D if explicitly flagged or matching 'All of the above' phrasing
      const shouldPinD =
        pinD === '1' ||
        pinD === 'true' ||
        pinD === 'có' ||
        optD.toLowerCase().includes('cả') && optD.toLowerCase().includes('đúng');

      validQuestions.push({
        questionText,
        options: [
          { key: 'A', content: optA, isPinned: false },
          { key: 'B', content: optB, isPinned: false },
          { key: 'C', content: optC, isPinned: false },
          {
            key: 'D',
            content: optD,
            isPinned: shouldPinD,
            pinnedPosition: shouldPinD ? 3 : null,
          },
        ],
        correctAnswer: rawCorrect,
        explanation,
        points: isNaN(points) || points <= 0 ? 1 : points,
      });
    }
  });

  return {
    totalRows: rawRows.length,
    validCount: validQuestions.length,
    errorCount: errors.length,
    validQuestions,
    errors,
  };
};

module.exports = {
  parseExamFile,
};
