import React, { useState } from 'react';
import {
    FileText,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Download,
    Eye,
    EyeOff
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ComparisonResult, CSVRow } from '../types/csv';
import { exportToCSV } from '../utils/csvUtils';
import { useToast } from '../hooks/use-toast';

const getSeverityColor = (confidence: number) => {
    if (confidence >= 0.8) return "default" as const;
    if (confidence >= 0.6) return "secondary" as const;
    return "destructive" as const;
};

// Função utilitária de segurança para sanitizar valores de exibição
const sanitizeDisplayValue = (value: string): string => {
    if (!value || typeof value !== 'string') return String(value || '');

    return value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .substring(0, 200); // Limita o comprimento da exibição
};

interface ComparisonResultsProps {
    result: ComparisonResult;
    originalFileName: string;
    comparisonFileName: string;
}

export const ComparisonResults = ({
    result,
    originalFileName,
    comparisonFileName
}: ComparisonResultsProps) => {
    const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
    const { toast } = useToast();

    const toggleDetails = (key: string) => {
        setShowDetails(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleExport = (data: CSVRow[], type: string) => {
        if (data.length === 0) {
            toast({
                title: "Nenhum dado para exportar",
                description: `Não há dados do tipo "${type}" para exportar.`,
                variant: "destructive"
            });
            return;
        }

        const fileName = `comparacao_${type}_${Date.now()}.csv`;
        exportToCSV(data, fileName);
        toast({
            title: "Exportação concluída",
            description: `Arquivo ${fileName} baixado com sucesso.`
        });
    };

    const getSeverityColor = (confidence: number) => {
        if (confidence >= 0.8) return 'default';
        if (confidence >= 0.6) return 'secondary';
        return 'destructive';
    };

    const getSeverityIcon = (confidence: number) => {
        if (confidence >= 0.8) return <CheckCircle className="h-4 w-4" />;
        if (confidence >= 0.6) return <AlertTriangle className="h-4 w-4" />;
        return <AlertTriangle className="h-4 w-4" />;
    };

    return (
        <div className="space-y-6">
            {/* Resumo da Comparação */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Resumo da Comparação
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Comparando "{originalFileName}" com "{comparisonFileName}"
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-success/10 rounded-lg">
                            <div className="text-2xl font-bold text-success">
                                {result.identical.length}
                            </div>
                            <div className="text-sm text-muted-foreground">Idênticas</div>
                        </div>
                        <div className="text-center p-4 bg-warning/10 rounded-lg">
                            <div className="text-2xl font-bold text-warning">
                                {result.modified.length}
                            </div>
                            <div className="text-sm text-muted-foreground">Modificadas</div>
                        </div>
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                                {result.added.length}
                            </div>
                            <div className="text-sm text-muted-foreground">Adicionadas</div>
                        </div>
                        <div className="text-center p-4 bg-destructive/10 rounded-lg">
                            <div className="text-2xl font-bold text-destructive">
                                {result.deleted.length}
                            </div>
                            <div className="text-sm text-muted-foreground">Removidas</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detalhes da Comparação */}
            <Tabs defaultValue="suggestions" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
                    <TabsTrigger value="modified">Modificadas</TabsTrigger>
                    <TabsTrigger value="added">Adicionadas</TabsTrigger>
                    <TabsTrigger value="deleted">Removidas</TabsTrigger>
                    <TabsTrigger value="identical">Idênticas</TabsTrigger>
                </TabsList>

                <TabsContent value="suggestions">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Sugestões de Merge ({result.suggestions.length})</CardTitle>
                            <Button
                                onClick={() => handleExport(
                                    result.suggestions.map(s => ({
                                        tipo: s.type,
                                        descricao: s.description,
                                        confianca: s.confidence,
                                        linha: s.rowIndex || 'N/A',
                                        campo: s.field || 'N/A'
                                    })),
                                    'sugestoes'
                                )}
                                variant="outline"
                                size="sm"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Exportar
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {result.suggestions.map((suggestion, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {getSeverityIcon(suggestion.confidence)}
                                                    <div className="inline-flex">
                                                        <Badge variant={getSeverityColor(suggestion.confidence)}>
                                                            {suggestion.type.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                        Confiança: {(suggestion.confidence * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <p className="text-sm">{suggestion.description}</p>
                                                {suggestion.rowIndex !== undefined && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Linha: {suggestion.rowIndex + 1}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {result.suggestions.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">
                                        Nenhuma sugestão disponível
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="modified">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Linhas Modificadas ({result.modified.length})
                            </CardTitle>
                            <Button
                                onClick={() => handleExport(
                                    result.modified.map(m => ({
                                        ...m.original,
                                        '_status': 'original'
                                    })).concat(
                                        result.modified.map(m => ({
                                            ...m.current,
                                            '_status': 'modificado'
                                        }))
                                    ),
                                    'modificadas'
                                )}
                                variant="outline"
                                size="sm"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Exportar
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {result.modified.map((mod, index) => (
                                    <div key={index} className="border rounded-lg">
                                        <div className="p-4 border-b bg-muted/50">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">Linha {mod.rowIndex + 1}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleDetails(`mod-${index}`)}
                                                >
                                                    {showDetails[`mod-${index}`] ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {mod.differences.map(field => (
                                                    <div key={field} className="inline-flex">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {field}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {showDetails[`mod-${index}`] && (
                                            <div className="p-4">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Campo</TableHead>
                                                            <TableHead>Valor Original</TableHead>
                                                            <TableHead>Valor Atual</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {mod.differences.map(field => (
                                                            <TableRow key={field}>
                                                                <TableCell className="font-medium">{sanitizeDisplayValue(field)}</TableCell>
                                                                <TableCell>{sanitizeDisplayValue(String(mod.original[field]))}</TableCell>
                                                                <TableCell>{sanitizeDisplayValue(String(mod.current[field]))}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {result.modified.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">
                                        Nenhuma linha modificada encontrada
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="added">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Linhas Adicionadas ({result.added.length})
                            </CardTitle>
                            <Button
                                onClick={() => handleExport(result.added, 'adicionadas')}
                                variant="outline"
                                size="sm"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Exportar
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {result.added.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {Object.keys(result.added[0]).map(header => (
                                                <TableHead key={header}>{header}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {result.added.map((row, index) => (
                                            <TableRow key={index}>
                                                {Object.values(row).map((value, i) => (
                                                    <TableCell key={i}>{sanitizeDisplayValue(String(value))}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    Nenhuma linha adicionada encontrada
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="deleted">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5" />
                                Linhas Removidas ({result.deleted.length})
                            </CardTitle>
                            <Button
                                onClick={() => handleExport(result.deleted, 'removidas')}
                                variant="outline"
                                size="sm"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Exportar
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {result.deleted.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {Object.keys(result.deleted[0]).map(header => (
                                                <TableHead key={header}>{header}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {result.deleted.map((row, index) => (
                                            <TableRow key={index}>
                                                {Object.values(row).map((value, i) => (
                                                    <TableCell key={i}>{sanitizeDisplayValue(String(value))}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    Nenhuma linha removida encontrada
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="identical">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Linhas Idênticas ({result.identical.length})
                            </CardTitle>
                            <Button
                                onClick={() => handleExport(result.identical, 'identicas')}
                                variant="outline"
                                size="sm"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Exportar
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {result.identical.length > 0 ? (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Mostrando primeiras 10 linhas de {result.identical.length} total
                                    </p>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {Object.keys(result.identical[0]).map(header => (
                                                    <TableHead key={header}>{header}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.identical.slice(0, 10).map((row, index) => (
                                                <TableRow key={index}>
                                                    {Object.values(row).map((value, i) => (
                                                        <TableCell key={i}>{sanitizeDisplayValue(String(value))}</TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    Nenhuma linha idêntica encontrada
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};