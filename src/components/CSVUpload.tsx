import { useState, useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { parseCSV } from '@/utils/csvUtils';
import { CSVFile } from '@/types/csv';

interface CSVUploadProps {
    onFilesUploaded: (files: CSVFile[]) => void;
    uploadedFiles: CSVFile[];
    maxFiles?: number;
}

export const CSVUpload = ({ onFilesUploaded, uploadedFiles, maxFiles = 2 }: CSVUploadProps) => {
    const [dragActive, setDragActive] = useState(false);
    const { toast } = useToast();

    const handleFiles = useCallback((files: FileList) => {
        const csvFiles: CSVFile[] = [];
        const filesArray = Array.from(files);

        if (uploadedFiles.length + filesArray.length > maxFiles) {
            toast({
                title: "Limite excedido",
                description: `Você pode fazer upload de no máximo ${maxFiles} arquivos.`,
                variant: "destructive"
            });
            return;
        }

        Promise.all(
            filesArray.map(file => {
                return new Promise<CSVFile>((resolve, reject) => {
                    // Security: Check file size (10MB limit)
                    const maxFileSize = 10 * 1024 * 1024; // 10MB
                    if (file.size > maxFileSize) {
                        reject(new Error(`${file.name} excede o limite de 10MB`));
                        return;
                    }

                    // Security: Validate file type
                    if (!file.name.toLowerCase().endsWith('.csv') ||
                        (file.type && !file.type.includes('csv') && !file.type.includes('text'))) {
                        reject(new Error(`${file.name} não é um arquivo CSV válido`));
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const content = e.target?.result as string;
                            const csvFile = parseCSV(content, file.name);
                            resolve(csvFile);
                        } catch (error) {
                            reject(error instanceof Error ? error : new Error(`Erro ao processar ${file.name}`));
                        }
                    };
                    reader.onerror = () => reject(new Error(`Erro ao ler ${file.name}`));
                    reader.readAsText(file);
                });
            })
        ).then(parsedFiles => {
            csvFiles.push(...parsedFiles);
            onFilesUploaded([...uploadedFiles, ...csvFiles]);
            toast({
                title: "Upload concluído",
                description: `${parsedFiles.length} arquivo(s) CSV carregado(s) com sucesso.`
            });
        }).catch(error => {
            toast({
                title: "Erro no upload",
                description: error instanceof Error ? error.message : 'Erro desconhecido',
                variant: "destructive"
            });
        });
    }, [uploadedFiles, maxFiles, onFilesUploaded, toast]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    }, [handleFiles]);

    const removeFile = useCallback((fileId: string) => {
        const updatedFiles = uploadedFiles.filter(file => file.id !== fileId);
        onFilesUploaded(updatedFiles);
        toast({
            title: "Arquivo removido",
            description: "Arquivo removido da lista."
        });
    }, [uploadedFiles, onFilesUploaded, toast]);

    return (
        <div className="space-y-4">
            <Card
                className={`border-2 border-dashed transition-all duration-200 ${dragActive
                        ? 'border-primary bg-primary/5 shadow-lg'
                        : 'border-border hover:border-primary/50'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <CardContent className="p-8">
                    <div className="text-center">
                        <Upload className={`mx-auto h-12 w-12 mb-4 transition-colors ${dragActive ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                        <h3 className="text-lg font-semibold mb-2">
                            Faça upload dos arquivos CSV
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Arraste e solte ou clique para selecionar arquivos CSV
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                            Máximo {maxFiles} arquivos • Formato: .csv
                        </p>
                        <input
                            type="file"
                            multiple
                            accept=".csv"
                            onChange={handleFileInput}
                            className="hidden"
                            id="csv-upload"
                        />
                        <Button asChild className="bg-primary hover:bg-primary-glow">
                            <label htmlFor="csv-upload" className="cursor-pointer">
                                Selecionar Arquivos
                            </label>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium text-foreground">
                        Arquivos carregados ({uploadedFiles.length}/{maxFiles})
                    </h4>
                    {uploadedFiles.map((file) => (
                        <Card key={file.id} className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <File className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-medium">{file.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {file.data.length} linhas • {file.headers.length} colunas
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeFile(file.id)}
                                    className="hover:bg-destructive hover:text-destructive-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};