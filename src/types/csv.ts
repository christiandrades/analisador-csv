export interface CSVFile {
    id: string;
    name: string;
    data: CSVRow[];
    headers: string[];
    uploadedAt: Date;
}

export interface CSVRow {
    [key: string]: string | number;
}

export interface ComparisonResult {
    identical: CSVRow[];
    modified: {
        original: CSVRow;
        current: CSVRow;
        differences: string[];
        rowIndex: number;
    }[];
    added: CSVRow[];
    deleted: CSVRow[];
    suggestions: MergeSuggestion[];
}

export interface MergeSuggestion {
    type: 'update' | 'add' | 'delete' | 'resolve_conflict';
    description: string;
    rowIndex?: number;
    field?: string;
    originalValue?: any;
    suggestedValue?: any;
    confidence: number;
}

export interface ValidationError {
    row: number;
    column: string;
    value: any;
    error: string;
    severity: 'error' | 'warning' | 'info';
}