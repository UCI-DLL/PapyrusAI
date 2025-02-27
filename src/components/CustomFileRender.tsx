/**
 * Code from: https://github.com/Alcumus/react-doc-viewer/issues/123
 * https://github.com/Alcumus/react-doc-viewer/issues/123#issuecomment-2262806859
 */

const CustomFileRender = ({ mainState: { currentDocument } }: any) => {
  if (!currentDocument) return null;

  const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
    currentDocument.uri
  )}&embedded=true`;

  return (
    <div style={{ width: "100%" }} id="my-doc-renderer">
      <iframe
        title="document"
        className={"doc"}
        width="100%"
        height="100%"
        src={googleDocsViewerUrl}
        frameBorder="0"
      ></iframe>
    </div>
  );
};

// Define the file types that this renderer will handle
CustomFileRender.fileTypes = [
  "pdf",
  "application/pdf",
  "xls",
  "application/vnd.ms-excel",
  "xlsx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "ppt",
  "application/vnd.ms-powerpoint",
  "pptx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "doc",
  "application/msword",
  "docx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
CustomFileRender.weight = 1;

export default CustomFileRender;