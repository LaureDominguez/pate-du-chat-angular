export interface ProcessedImage {
    type: 'existing' | 'preview';  // pour distinguer les images déjà en base et les nouvelles
    data: string;                  // URL complète (pour affichage dans <img>)
    path?: string;                 // uniquement pour les images existantes (chemin DB à stocker dans product.images[])
    file?: File;                   // uniquement pour les previews, à uploader via ImageService
    originalIndex?: number;        // index original (facultatif, utile en debug)
}
