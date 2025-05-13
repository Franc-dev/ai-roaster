declare module 'dom-to-image-more' {
  interface Options {
    bgcolor?: string;
    height?: number;
    width?: number;
    style?: object;
    quality?: number;
    imagePlaceholder?: string;
    cacheBust?: boolean;
  }

  interface DomToImage {
    toBlob(node: HTMLElement, options?: Options): Promise<Blob>;
    toPng(node: HTMLElement, options?: Options): Promise<string>;
    toJpeg(node: HTMLElement, options?: Options): Promise<string>;
    toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>;
  }

  const domtoimage: DomToImage;
  export default domtoimage;
} 