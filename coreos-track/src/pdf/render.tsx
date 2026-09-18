import type { DocumentProps } from "@react-pdf/renderer";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReceiptDocument, type ReceiptData } from "@/pdf/ReceiptDocument";

/**
 * Render a watermarked receipt to a PDF buffer.
 *
 * `renderToBuffer` is typed as taking `ReactElement<DocumentProps>`, i.e. a bare
 * `<Document>`; wrapping it in our own component is supported at runtime but
 * not expressible in that signature, hence the cast.
 */
export async function renderReceiptPdf(data: ReceiptData): Promise<Buffer> {
  const element = (
    <ReceiptDocument data={data} />
  ) as unknown as React.ReactElement<DocumentProps>;
  return renderToBuffer(element);
}
