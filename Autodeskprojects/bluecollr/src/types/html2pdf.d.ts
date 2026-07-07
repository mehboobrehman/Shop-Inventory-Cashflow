declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      foreignObjectRendering?: boolean;
      onclone?: (clonedDoc: Document) => void;
      [key: string]: unknown;
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: "portrait" | "landscape";
      [key: string]: unknown;
    };
    pagebreak?: { mode?: string | string[]; [key: string]: unknown };
  }

  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(element: HTMLElement): Html2PdfInstance;
    save(): Promise<void>;
    toPdf(): Html2PdfInstance;
    get(): Promise<jsPDF>;
  }

  interface Html2PdfStatic {
    (): Html2PdfInstance;
    set(options: Html2PdfOptions): Html2PdfInstance;
  }

  const html2pdf: Html2PdfStatic;
  export default html2pdf;
}
