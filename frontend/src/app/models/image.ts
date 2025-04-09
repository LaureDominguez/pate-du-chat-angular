export interface ProcessedImage {
    type: 'existing' | 'preview';
    data: string;          
    originalIndex: number;  
}
