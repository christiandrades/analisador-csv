import { CSVFile, CSVRow, ComparisonResult, MergeSuggestion, ValidationError } from '@/types/csv';

export const parseCSV = (content: string, fileName: string): CSVFile => {
    // Validate file size (max 10MB)
    if (content.length > 10 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Tamanho máximo permitido: 10MB');
    }

    // Validate file name
    if (!fileName || fileName.length > 255) {
        throw new Error('Nome de arquivo inválido');
    }

    const lines = content.trim().split('\n');
    if (lines.length === 0) {
        throw new Error('Arquivo CSV vazio');
    }

    // Limit number of lines to prevent memory issues
    if (lines.length > 50000) {
        throw new Error('Arquivo muito grande. Máximo de 50.000 linhas permitido');
    }

    const headers = lines[0].split(',').map(h => sanitizeCSVValue(h.trim().replace(/"/g, '')));

    // Validate headers
    if (headers.some(h => h.length === 0)) {
        throw new Error('Cabeçalhos não podem estar vazios');
    }

    if (headers.length > 100) {
        throw new Error('Muitas colunas. Máximo de 100 colunas permitido');
    }

    const data: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => sanitizeCSVValue(v.trim().replace(/"/g, '')));
        if (values.length === headers.length) {
            const row: CSVRow = {};
            headers.forEach((header, index) => {
                const value = values[index];
                // Sanitize and validate value length
                if (typeof value === 'string' && value.length > 1000) {
                    throw new Error(`Valor muito longo na linha ${i + 1}, coluna ${header}`);
                }
                // Tenta converter para número se possível
                row[header] = isNaN(Number(value)) ? value : Number(value);
            });
            data.push(row);
        }
    }

    return {
        id: generateId(),
        name: fileName,
        data,
        headers,
        uploadedAt: new Date()
    };
};

export const compareCSVs = (file1: CSVFile, file2: CSVFile, keyColumn?: string): ComparisonResult => {
    const result: ComparisonResult = {
        identical: [],
        modified: [],
        added: [],
        deleted: [],
        suggestions: []
    };

    // Se não há coluna chave definida, usa a primeira coluna
    const key = keyColumn || file1.headers[0] || file2.headers[0];

    if (!key) {
        throw new Error('Não foi possível identificar uma coluna chave para comparação');
    }

    // Cria mapas para comparação rápida
    const map1 = new Map(file1.data.map(row => [String(row[key]), row]));
    const map2 = new Map(file2.data.map(row => [String(row[key]), row]));

    // Verifica linhas modificadas e idênticas
    map1.forEach((row1, keyValue) => {
        const row2 = map2.get(keyValue);
        if (row2) {
            const differences = findRowDifferences(row1, row2, file1.headers);
            if (differences.length === 0) {
                result.identical.push(row1);
            } else {
                const rowIndex = file1.data.findIndex(r => String(r[key]) === keyValue);
                result.modified.push({
                    original: row1,
                    current: row2,
                    differences,
                    rowIndex
                });
            }
        } else {
            result.deleted.push(row1);
        }
    });

    // Verifica linhas adicionadas
    map2.forEach((row2, keyValue) => {
        if (!map1.has(keyValue)) {
            result.added.push(row2);
        }
    });

    // Gera sugestões
    result.suggestions = generateMergeSuggestions(result);

    return result;
};

const findRowDifferences = (row1: CSVRow, row2: CSVRow, headers: string[]): string[] => {
    const differences: string[] = [];

    headers.forEach(header => {
        if (row1[header] !== row2[header]) {
            differences.push(header);
        }
    });

    return differences;
};

const generateMergeSuggestions = (comparison: ComparisonResult): MergeSuggestion[] => {
    const suggestions: MergeSuggestion[] = [];

    // Sugestões para linhas modificadas
    comparison.modified.forEach(mod => {
        mod.differences.forEach(field => {
            const confidence = calculateConfidence(mod.original[field], mod.current[field]);
            suggestions.push({
                type: 'update',
                description: `Atualizar ${field} de "${mod.original[field]}" para "${mod.current[field]}"`,
                rowIndex: mod.rowIndex,
                field,
                originalValue: mod.original[field],
                suggestedValue: mod.current[field],
                confidence
            });
        });
    });

    // Sugestões para linhas adicionadas
    comparison.added.forEach(row => {
        suggestions.push({
            type: 'add',
            description: `Adicionar nova linha: ${Object.values(row).slice(0, 3).join(', ')}...`,
            suggestedValue: row,
            confidence: 0.8
        });
    });

    // Sugestões para linhas removidas
    comparison.deleted.forEach(row => {
        suggestions.push({
            type: 'delete',
            description: `Remover linha: ${Object.values(row).slice(0, 3).join(', ')}...`,
            originalValue: row,
            confidence: 0.7
        });
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
};

const calculateConfidence = (oldValue: any, newValue: any): number => {
    if (typeof oldValue === 'number' && typeof newValue === 'number') {
        const diff = Math.abs(oldValue - newValue);
        const avg = (oldValue + newValue) / 2;
        return Math.max(0, 1 - (diff / avg));
    }

    if (typeof oldValue === 'string' && typeof newValue === 'string') {
        const similarity = calculateStringSimilarity(oldValue, newValue);
        return similarity;
    }

    return 0.5; // Default confidence
};

const calculateStringSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + indicator
            );
        }
    }

    return matrix[str2.length][str1.length];
};

export const validateCSV = (csvFile: CSVFile): ValidationError[] => {
    const errors: ValidationError[] = [];

    csvFile.data.forEach((row, index) => {
        csvFile.headers.forEach(header => {
            const value = row[header];

            // Validação de valores vazios
            if (value === undefined || value === null || value === '') {
                errors.push({
                    row: index + 1,
                    column: header,
                    value,
                    error: 'Valor vazio encontrado',
                    severity: 'warning'
                });
            }

            // Validação de tipos inconsistentes
            if (header.toLowerCase().includes('email') && typeof value === 'string') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errors.push({
                        row: index + 1,
                        column: header,
                        value,
                        error: 'Formato de email inválido',
                        severity: 'error'
                    });
                }
            }
        });
    });

    return errors;
};

export const exportToCSV = (data: CSVRow[], filename: string): void => {
    if (data.length === 0) return;

    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(filename);

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.map(h => `"${sanitizeForCSVExport(String(h))}"`).join(','),
        ...data.map(row => headers.map(header => `"${sanitizeForCSVExport(String(row[header] ?? ''))}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', sanitizedFilename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

const generateId = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Security utility functions
const sanitizeCSVValue = (value: string): string => {
    if (!value || typeof value !== 'string') return String(value || '');

    // Remove or escape potentially dangerous characters
    return value
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocols
        .trim();
};

const sanitizeForCSVExport = (value: string): string => {
    if (!value || typeof value !== 'string') return String(value || '');

    // Prevent CSV injection by escaping formula characters
    const dangerousChars = /^[=+\-@]/;
    let sanitized = value.replace(/"/g, '""'); // Escape quotes

    // Prefix dangerous formulas with single quote to neutralize them
    if (dangerousChars.test(sanitized)) {
        sanitized = "'" + sanitized;
    }

    return sanitized;
};

const sanitizeFilename = (filename: string): string => {
    if (!filename || typeof filename !== 'string') return 'export.csv';

    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters
        .replace(/_{2,}/g, '_') // Replace multiple underscores
        .substring(0, 100) // Limit length
        || 'export.csv';
};