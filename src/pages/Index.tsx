import { useState } from 'react';
import { FileText, Database, BarChart3, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CSVUpload } from '../components/CSVUpload';
import { ComparisonResults } from '../components/ComparisonResults';
import { CSVFile, ComparisonResult } from '../types/csv';
import { compareCSVs } from '../utils/csvUtils';
import { useToast } from '../hooks/use-toast';

const Index = () => {
    const [uploadedFiles, setUploadedFiles] = useState<CSVFile[]>([]);
    const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
    const [keyColumn, setKeyColumn] = useState<string>('');
    const [isComparing, setIsComparing] = useState(false);
    const { toast } = useToast();

    const handleFilesUploaded = (files: CSVFile[]) => {
        setUploadedFiles(files);
        setComparisonResult(null);
        setKeyColumn('');
    };

    const handleCompare = async () => {
        if (uploadedFiles.length < 2) {
            toast({
                title: "Arquivos insuficientes",
                description: "É necessário carregar pelo menos 2 arquivos CSV para comparação.",
                variant: "destructive"
            });
            return;
        }

        setIsComparing(true);

        try {
            // Simula tempo de processamento para UX
            await new Promise(resolve => setTimeout(resolve, 1000));

            const result = compareCSVs(uploadedFiles[0], uploadedFiles[1], keyColumn);
            setComparisonResult(result);

            toast({
                title: "Comparação concluída",
                description: `Encontradas ${result.modified.length} modificações, ${result.added.length} adições e ${result.deleted.length} remoções.`
            });
        } catch (error) {
            toast({
                title: "Erro na comparação",
                description: error instanceof Error ? error.message : "Erro desconhecido",
                variant: "destructive"
            });
        } finally {
            setIsComparing(false);
        }
    };

    const availableColumns = uploadedFiles.length >= 2
        ? Array.from(new Set([...uploadedFiles[0].headers, ...uploadedFiles[1].headers]))
        : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
            <div className="container mx-auto p-6 space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 bg-primary rounded-lg">
                            <Database className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                            Analisador CSV
                        </h1>
                    </div>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Compare, analise e encontre inconsistências entre planilhas CSV com sugestões inteligentes de merge
                    </p>
                </div>

                {/* Features Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                        <CardHeader className="text-center">
                            <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                            <CardTitle className="text-lg">Comparação Avançada</CardTitle>
                            <CardDescription>
                                Compare dados linha por linha e identifique diferenças automaticamente
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="border-accent/20 hover:border-accent/40 transition-colors">
                        <CardHeader className="text-center">
                            <BarChart3 className="h-8 w-8 text-accent mx-auto mb-2" />
                            <CardTitle className="text-lg">Análise Inteligente</CardTitle>
                            <CardDescription>
                                Detecte inconsistências e receba sugestões baseadas em algoritmos avançados
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="border-success/20 hover:border-success/40 transition-colors">
                        <CardHeader className="text-center">
                            <Settings className="h-8 w-8 text-success mx-auto mb-2" />
                            <CardTitle className="text-lg">Merge Automático</CardTitle>
                            <CardDescription>
                                Sugestões inteligentes para resolver conflitos e unificar dados
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                {/* Upload Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>1. Carregar Arquivos CSV</CardTitle>
                        <CardDescription>
                            Faça upload de até 2 arquivos CSV para comparação
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CSVUpload
                            onFilesUploaded={handleFilesUploaded}
                            uploadedFiles={uploadedFiles}
                            maxFiles={2}
                        />
                    </CardContent>
                </Card>

                {/* Configuration Section */}
                {uploadedFiles.length >= 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Configurar Comparação</CardTitle>
                            <CardDescription>
                                Selecione a coluna chave para identificar registros correspondentes
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Coluna Chave (Identificador único)
                                    </label>
                                    <Select value={keyColumn} onValueChange={setKeyColumn}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma coluna chave" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableColumns.map(column => (
                                                <SelectItem key={column} value={column}>
                                                    {column}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        onClick={handleCompare}
                                        disabled={isComparing || !keyColumn}
                                        className="w-full bg-primary hover:bg-primary-glow"
                                    >
                                        {isComparing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                Comparando...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="h-4 w-4 mr-2" />
                                                Iniciar Comparação
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {keyColumn && (
                                <div className="bg-muted/50 p-4 rounded-lg">
                                    <p className="text-sm">
                                        <strong>Coluna selecionada:</strong> {keyColumn}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Esta coluna será usada para identificar registros correspondentes entre os arquivos.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Results Section */}
                {comparisonResult && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold mb-2">Resultados da Comparação</h2>
                            <p className="text-muted-foreground">
                                Análise completa entre "{uploadedFiles[0]?.name}" e "{uploadedFiles[1]?.name}"
                            </p>
                        </div>

                        <ComparisonResults
                            result={comparisonResult}
                            originalFileName={uploadedFiles[0]?.name || ''}
                            comparisonFileName={uploadedFiles[1]?.name || ''}
                        />
                    </div>
                )}

                {/* Getting Started */}
                {uploadedFiles.length === 0 && (
                    <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                        <CardContent className="p-8 text-center">
                            <h3 className="text-xl font-semibold mb-4">Como começar?</h3>
                            <div className="grid md:grid-cols-3 gap-6 text-sm">
                                <div>
                                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                                        1
                                    </div>
                                    <p>Faça upload de 2 arquivos CSV que deseja comparar</p>
                                </div>
                                <div>
                                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                                        2
                                    </div>
                                    <p>Selecione a coluna chave para identificar registros</p>
                                </div>
                                <div>
                                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                                        3
                                    </div>
                                    <p>Visualize diferenças e aplique sugestões de merge</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Index;