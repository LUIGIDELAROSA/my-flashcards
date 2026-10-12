declare module 'pdf-parse' {
  interface Options {
    pagerender?: (pageData: any) => string;
    max?: number;
    version?: string;
  }
  
  interface Result {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  function PDFParse(data: Buffer, options?: Options): Promise<Result>;
  export = PDFParse;
}