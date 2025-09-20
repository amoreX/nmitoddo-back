declare module 'pdfmake' {
  // minimal typings to use PdfPrinter in Node
  import type PDFKit = require('pdfkit');
  class PdfPrinter {
    constructor(fonts: any);
    createPdfKitDocument(docDefinition: any): PDFKit.PDFDocument;
  }
  export = PdfPrinter;
}

declare module 'pdfmake/interfaces' {
  export type Content = any;
  export interface StyleDictionary { [key: string]: any }
  export interface TDocumentDefinitions {
    content: any;
    styles?: StyleDictionary;
    defaultStyle?: any;
    pageSize?: any;
    pageMargins?: any;
    info?: any;
    footer?: any;
  }
}