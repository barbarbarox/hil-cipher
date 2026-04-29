/**
 * Hill Cipher Engine
 * Core cryptographic operations with step-by-step tracking
 * Supports 2x2 and 3x3 key matrices
 */

class HillCipher {
  constructor() {
    this.ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.MOD = 26;
  }

  // ─── TEXT / NUMBER CONVERSION ───────────────────────────────

  charToNum(ch) {
    return ch.charCodeAt(0) - 65; // A=0, B=1, ..., Z=25
  }

  numToChar(n) {
    return this.ALPHABET[((n % this.MOD) + this.MOD) % this.MOD];
  }

  textToNumbers(text) {
    return [...text].map(ch => this.charToNum(ch));
  }

  numbersToText(nums) {
    return nums.map(n => this.numToChar(n)).join('');
  }

  cleanText(text) {
    return text.toUpperCase().replace(/[^A-Z]/g, '');
  }

  padText(text, blockSize) {
    const remainder = text.length % blockSize;
    if (remainder === 0) return text;
    return text + 'X'.repeat(blockSize - remainder);
  }

  // ─── MATRIX OPERATIONS ─────────────────────────────────────

  /**
   * Multiply key matrix by a column vector, mod 26
   * @param {number[][]} matrix - n×n key matrix
   * @param {number[]} vector - column vector of length n
   * @returns {{raw: number[], modded: number[], details: object[]}}
   */
  matrixVectorMultiply(matrix, vector) {
    const n = matrix.length;
    const raw = [];
    const modded = [];
    const details = [];

    for (let i = 0; i < n; i++) {
      let sum = 0;
      const terms = [];
      for (let j = 0; j < n; j++) {
        const product = matrix[i][j] * vector[j];
        terms.push({ a: matrix[i][j], b: vector[j], product });
        sum += product;
      }
      raw.push(sum);
      modded.push(((sum % this.MOD) + this.MOD) % this.MOD);
      details.push({ terms, sum, modResult: modded[i] });
    }

    return { raw, modded, details };
  }

  /**
   * Calculate determinant of a matrix
   * @param {number[][]} matrix - square matrix
   * @returns {number}
   */
  determinant(matrix) {
    const n = matrix.length;
    if (n === 1) return matrix[0][0];

    if (n === 2) {
      return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    }

    // 3x3 using cofactor expansion along first row
    if (n === 3) {
      return (
        matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
        matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
        matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
      );
    }

    throw new Error('Only 2x2 and 3x3 matrices are supported');
  }

  /**
   * Extended Euclidean Algorithm to find modular inverse
   * @param {number} a - the number
   * @param {number} mod - the modulus
   * @returns {number|null} - inverse or null if not exists
   */
  modInverse(a, mod) {
    a = ((a % mod) + mod) % mod;
    for (let x = 1; x < mod; x++) {
      if ((a * x) % mod === 1) return x;
    }
    return null;
  }

  /**
   * GCD of two numbers
   */
  gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      [a, b] = [b, a % b];
    }
    return a;
  }

  /**
   * Calculate cofactor matrix
   * @param {number[][]} matrix
   * @returns {number[][]}
   */
  cofactorMatrix(matrix) {
    const n = matrix.length;

    if (n === 2) {
      return [
        [matrix[1][1], -matrix[1][0]],
        [-matrix[0][1], matrix[0][0]]
      ];
    }

    if (n === 3) {
      const cof = [];
      for (let i = 0; i < 3; i++) {
        cof[i] = [];
        for (let j = 0; j < 3; j++) {
          // Minor: 2x2 submatrix excluding row i, col j
          const minor = [];
          for (let r = 0; r < 3; r++) {
            if (r === i) continue;
            const row = [];
            for (let c = 0; c < 3; c++) {
              if (c === j) continue;
              row.push(matrix[r][c]);
            }
            minor.push(row);
          }
          const det2 = minor[0][0] * minor[1][1] - minor[0][1] * minor[1][0];
          const sign = ((i + j) % 2 === 0) ? 1 : -1;
          cof[i][j] = sign * det2;
        }
      }
      return cof;
    }

    throw new Error('Only 2x2 and 3x3 matrices are supported');
  }

  /**
   * Transpose matrix
   */
  transpose(matrix) {
    const n = matrix.length;
    const result = [];
    for (let i = 0; i < n; i++) {
      result[i] = [];
      for (let j = 0; j < n; j++) {
        result[i][j] = matrix[j][i];
      }
    }
    return result;
  }

  /**
   * Adjugate (adjoint) matrix = transpose of cofactor matrix
   */
  adjugate(matrix) {
    return this.transpose(this.cofactorMatrix(matrix));
  }

  /**
   * Calculate inverse matrix mod 26 with detailed steps
   * @param {number[][]} matrix
   * @returns {{inverse: number[][], steps: object}|null}
   */
  inverseMatrixMod26(matrix) {
    const n = matrix.length;
    const det = this.determinant(matrix);
    const detMod = ((det % this.MOD) + this.MOD) % this.MOD;

    // Check if inverse exists
    if (this.gcd(detMod, this.MOD) !== 1) {
      return null;
    }

    const detInv = this.modInverse(detMod, this.MOD);
    if (detInv === null) return null;

    const adj = this.adjugate(matrix);

    // Multiply adjugate by detInv mod 26
    const inverse = [];
    for (let i = 0; i < n; i++) {
      inverse[i] = [];
      for (let j = 0; j < n; j++) {
        inverse[i][j] = ((adj[i][j] * detInv) % this.MOD + this.MOD) % this.MOD;
      }
    }

    return {
      inverse,
      steps: {
        determinant: det,
        detMod26: detMod,
        detInverse: detInv,
        cofactorMatrix: this.cofactorMatrix(matrix),
        adjugate: adj,
        inverseMatrix: inverse
      }
    };
  }

  // ─── VALIDATION ─────────────────────────────────────────────

  /**
   * Validate a key matrix
   * @param {number[][]} matrix
   * @returns {{valid: boolean, error: string|null, details: object}}
   */
  validateKey(matrix) {
    const n = matrix.length;

    // Check square
    for (const row of matrix) {
      if (row.length !== n) {
        return { valid: false, error: 'Matriks harus persegi (jumlah baris = jumlah kolom)', details: {} };
      }
    }

    // Check size
    if (n !== 2 && n !== 3) {
      return { valid: false, error: 'Hanya matriks 2×2 atau 3×3 yang didukung', details: {} };
    }

    // Check all integers
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (!Number.isInteger(matrix[i][j])) {
          return { valid: false, error: `Elemen [${i+1}][${j+1}] bukan bilangan bulat`, details: {} };
        }
      }
    }

    // Check determinant
    const det = this.determinant(matrix);
    const detMod = ((det % this.MOD) + this.MOD) % this.MOD;

    if (detMod === 0) {
      return {
        valid: false,
        error: `Determinan = ${det} (mod 26 = ${detMod}). Matriks singular, tidak punya invers.`,
        details: { determinant: det, detMod26: detMod }
      };
    }

    if (this.gcd(detMod, this.MOD) !== 1) {
      return {
        valid: false,
        error: `Determinan mod 26 = ${detMod}. GCD(${detMod}, 26) = ${this.gcd(detMod, this.MOD)} ≠ 1. Determinan tidak relatif prima dengan 26.`,
        details: { determinant: det, detMod26: detMod, gcd: this.gcd(detMod, this.MOD) }
      };
    }

    return {
      valid: true,
      error: null,
      details: { determinant: det, detMod26: detMod, gcd: 1 }
    };
  }

  // ─── ENCRYPTION ─────────────────────────────────────────────

  /**
   * Encrypt plaintext with step-by-step details
   * @param {string} plaintext
   * @param {number[][]} keyMatrix
   * @returns {{ciphertext: string, steps: object[]}}
   */
  encrypt(plaintext, keyMatrix) {
    const steps = [];
    const n = keyMatrix.length;

    // Step 1: Clean and prepare text
    const cleaned = this.cleanText(plaintext);
    const padded = this.padText(cleaned, n);
    steps.push({
      id: 'prepare',
      title: 'Persiapan Teks',
      description: 'Bersihkan teks dan tambahkan padding jika perlu',
      data: {
        original: plaintext,
        cleaned,
        padded,
        paddingAdded: padded.length > cleaned.length,
        blockSize: n
      }
    });

    // Step 2: Convert to numbers
    const numbers = this.textToNumbers(padded);
    const conversionTable = [...padded].map((ch, i) => ({
      char: ch,
      num: numbers[i]
    }));
    steps.push({
      id: 'convert',
      title: 'Konversi Huruf ke Angka',
      description: 'Setiap huruf diubah menjadi angka (A=0, B=1, ..., Z=25)',
      data: { conversionTable, numbers }
    });

    // Step 3: Split into blocks
    const blocks = [];
    for (let i = 0; i < numbers.length; i += n) {
      blocks.push(numbers.slice(i, i + n));
    }
    const blockChars = [];
    for (let i = 0; i < padded.length; i += n) {
      blockChars.push(padded.slice(i, i + n));
    }
    steps.push({
      id: 'blocks',
      title: 'Pembagian Blok',
      description: `Teks dibagi menjadi blok-blok berukuran ${n}`,
      data: { blocks, blockChars, blockSize: n }
    });

    // Step 4: Key matrix display
    steps.push({
      id: 'key',
      title: 'Matriks Kunci (K)',
      description: 'Matriks kunci yang digunakan untuk enkripsi',
      data: { keyMatrix }
    });

    // Step 5: Matrix multiplication for each block
    const resultBlocks = [];
    const multiplicationSteps = [];

    for (let b = 0; b < blocks.length; b++) {
      const block = blocks[b];
      const result = this.matrixVectorMultiply(keyMatrix, block);
      resultBlocks.push(result.modded);
      multiplicationSteps.push({
        blockIndex: b,
        blockChars: blockChars[b],
        inputVector: block,
        ...result
      });
    }

    steps.push({
      id: 'multiply',
      title: 'Perkalian Matriks',
      description: 'C = K × P mod 26 untuk setiap blok',
      data: { multiplicationSteps, keyMatrix }
    });

    // Step 6: Final result
    const allResultNumbers = resultBlocks.flat();
    const ciphertext = this.numbersToText(allResultNumbers);

    const resultConversion = allResultNumbers.map((n, i) => ({
      num: n,
      char: ciphertext[i]
    }));

    steps.push({
      id: 'result',
      title: 'Hasil Enkripsi',
      description: 'Konversi kembali angka ke huruf untuk mendapatkan ciphertext',
      data: { resultNumbers: allResultNumbers, resultConversion, ciphertext }
    });

    return { ciphertext, steps };
  }

  // ─── DECRYPTION ─────────────────────────────────────────────

  /**
   * Decrypt ciphertext with step-by-step details
   * @param {string} ciphertext
   * @param {number[][]} keyMatrix
   * @returns {{plaintext: string, steps: object[]}|{error: string}}
   */
  decrypt(ciphertext, keyMatrix) {
    const steps = [];
    const n = keyMatrix.length;

    // Step 1: Validate key
    const validation = this.validateKey(keyMatrix);
    if (!validation.valid) {
      return { error: validation.error };
    }

    // Step 2: Clean text
    const cleaned = this.cleanText(ciphertext);
    const padded = this.padText(cleaned, n);
    steps.push({
      id: 'prepare',
      title: 'Persiapan Teks',
      description: 'Bersihkan ciphertext',
      data: {
        original: ciphertext,
        cleaned,
        padded,
        blockSize: n
      }
    });

    // Step 3: Show key matrix
    steps.push({
      id: 'key',
      title: 'Matriks Kunci (K)',
      description: 'Matriks kunci yang digunakan',
      data: { keyMatrix }
    });

    // Step 4: Calculate inverse matrix (detailed)
    const det = this.determinant(keyMatrix);
    const detMod = ((det % this.MOD) + this.MOD) % this.MOD;
    const detInv = this.modInverse(detMod, this.MOD);
    const cofMatrix = this.cofactorMatrix(keyMatrix);
    const adj = this.adjugate(keyMatrix);
    const invResult = this.inverseMatrixMod26(keyMatrix);

    steps.push({
      id: 'determinant',
      title: 'Hitung Determinan',
      description: n === 2
        ? `det(K) = (${keyMatrix[0][0]})(${keyMatrix[1][1]}) - (${keyMatrix[0][1]})(${keyMatrix[1][0]}) = ${det}`
        : `det(K) = ${det}`,
      data: {
        keyMatrix,
        determinant: det,
        detMod26: detMod,
        formula: n === 2 ? 'det(K) = ad - bc' : 'Ekspansi kofaktor baris pertama'
      }
    });

    steps.push({
      id: 'detInverse',
      title: 'Invers Modular Determinan',
      description: `Cari x sehingga ${detMod} × x ≡ 1 (mod 26)`,
      data: {
        detMod26: detMod,
        detInverse: detInv,
        verification: `${detMod} × ${detInv} = ${detMod * detInv} ≡ ${(detMod * detInv) % 26} (mod 26)`
      }
    });

    steps.push({
      id: 'cofactor',
      title: 'Matriks Kofaktor',
      description: 'Hitung kofaktor dari setiap elemen',
      data: { cofactorMatrix: cofMatrix }
    });

    steps.push({
      id: 'adjugate',
      title: 'Matriks Adjoin (Adjugate)',
      description: 'Transpose dari matriks kofaktor',
      data: { adjugate: adj }
    });

    steps.push({
      id: 'inverse',
      title: 'Matriks Invers K⁻¹',
      description: `K⁻¹ = ${detInv} × adj(K) mod 26`,
      data: {
        detInverse: detInv,
        adjugate: adj,
        inverseMatrix: invResult.inverse
      }
    });

    // Step 5: Convert ciphertext to numbers
    const numbers = this.textToNumbers(padded);
    const conversionTable = [...padded].map((ch, i) => ({
      char: ch,
      num: numbers[i]
    }));
    steps.push({
      id: 'convert',
      title: 'Konversi Ciphertext ke Angka',
      description: 'Setiap huruf ciphertext diubah menjadi angka',
      data: { conversionTable, numbers }
    });

    // Step 6: Split into blocks
    const blocks = [];
    for (let i = 0; i < numbers.length; i += n) {
      blocks.push(numbers.slice(i, i + n));
    }
    const blockChars = [];
    for (let i = 0; i < padded.length; i += n) {
      blockChars.push(padded.slice(i, i + n));
    }
    steps.push({
      id: 'blocks',
      title: 'Pembagian Blok Ciphertext',
      description: `Ciphertext dibagi menjadi blok-blok berukuran ${n}`,
      data: { blocks, blockChars, blockSize: n }
    });

    // Step 7: Multiply by inverse matrix
    const inverseMatrix = invResult.inverse;
    const resultBlocks = [];
    const multiplicationSteps = [];

    for (let b = 0; b < blocks.length; b++) {
      const block = blocks[b];
      const result = this.matrixVectorMultiply(inverseMatrix, block);
      resultBlocks.push(result.modded);
      multiplicationSteps.push({
        blockIndex: b,
        blockChars: blockChars[b],
        inputVector: block,
        ...result
      });
    }

    steps.push({
      id: 'multiply',
      title: 'Perkalian dengan K⁻¹',
      description: 'P = K⁻¹ × C mod 26 untuk setiap blok',
      data: { multiplicationSteps, keyMatrix: inverseMatrix }
    });

    // Step 8: Final result
    const allResultNumbers = resultBlocks.flat();
    const plaintext = this.numbersToText(allResultNumbers);

    const resultConversion = allResultNumbers.map((n, i) => ({
      num: n,
      char: plaintext[i]
    }));

    steps.push({
      id: 'result',
      title: 'Hasil Dekripsi',
      description: 'Konversi kembali angka ke huruf untuk mendapatkan plaintext',
      data: { resultNumbers: allResultNumbers, resultConversion, plaintext }
    });

    return { plaintext, steps };
  }

  // ─── RANDOM KEY GENERATION ──────────────────────────────────

  /**
   * Generate a random valid key matrix
   * @param {number} size - 2 or 3
   * @returns {number[][]}
   */
  generateRandomKey(size) {
    const maxAttempts = 1000;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const matrix = [];
      for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j < size; j++) {
          matrix[i][j] = Math.floor(Math.random() * 26);
        }
      }
      const validation = this.validateKey(matrix);
      if (validation.valid) return matrix;
    }
    // Fallback: known valid matrices
    if (size === 2) return [[3, 3], [2, 5]];
    return [[6, 24, 1], [13, 16, 10], [20, 17, 15]];
  }
}

// Export for use
const hillCipher = new HillCipher();
