import React, { useState, useRef } from "react";
import { _GSPS2PDF } from "./lib/background.js";
import { Card, CardHeader, CardContent, CardTitle } from "./components/ui/card.jsx";
import { Button } from "./components/ui/button.jsx";
import { Input } from "./components/ui/input.jsx";
import { Upload, Download, X, FileText } from "lucide-react";

function loadPDFData(response, filename) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", response.pdfDataURL);
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
      window.URL.revokeObjectURL(response.pdfDataURL);
      const blob = new Blob([xhr.response], { type: "application/pdf" });
      const pdfURL = window.URL.createObjectURL(blob);
      resolve({ pdfURL });
    };
    xhr.send();
  });
}

export default function App() {
  const [state, setState] = useState("init");
  const [file, setFile] = useState(undefined);
  const [downloadLink, setDownloadLink] = useState(undefined);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  function compressPDF(pdf, filename) {
    const dataObject = { psDataURL: pdf };
    _GSPS2PDF(
      dataObject,
      (element) => {
        console.log(element);
        setState("toBeDownloaded");
        loadPDFData(element, filename).then(({ pdfURL }) => {
          setDownloadLink(pdfURL);
        });
      },
      (...args) => console.log("Progress:", JSON.stringify(args)),
      (element) => console.log("Status Update:", JSON.stringify(element)),
    );
  }

  const changeHandler = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      const url = window.URL.createObjectURL(selectedFile);
      setFile({ filename: selectedFile.name, url });
      setState("selected");
      setError(null);
    } else {
      setError("Please select a valid PDF file.");
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (file) {
      const { filename, url } = file;
      compressPDF(url, filename);
      setState("loading");
    }
  };

  const removeFile = () => {
    setFile(undefined);
    setState("init");
    setDownloadLink(undefined);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  let minFileName = file && file.filename && file.filename.replace(".pdf", "-min.pdf");

  return (
    <Card className="w-full max-w-xl mx-auto my-8">
      <CardHeader className="pb-6 w-full">
        <div className="flex items-center space-x-4">
          <FileText className="w-16 h-16 text-primary" />
          <CardTitle className="text-2xl font-bold">
            PDF Compressor
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-10 w-full">
        {/* File upload section */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Upload a PDF</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 flex flex-col gap-4">
              <p className="text-sm">
                Upload a PDF file to compress.
              </p>
              <div className="w-full h-40 bg-gray-100 rounded-lg flex-1 flex items-center justify-center min-h-40">
                {file ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <FileText className="h-16 w-16 text-primary" />
                    <p className="text-sm mt-2">{file.filename}</p>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={removeFile}
                      className="absolute top-2 right-2 z-10 rounded-full bg-background border border-input h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <FileText className="h-16 w-16 text-gray-400" />
                )}
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-sm"
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose PDF
              </Button>
              <Input
                id="pdf-upload"
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={changeHandler}
                className="hidden"
              />
            </div>
            {downloadLink && (
              <div className="flex-1 flex flex-col gap-4">
                <h3 className="text-lg font-medium">Compressed PDF</h3>
                <div className="relative w-full h-40 flex-1 flex items-center justify-center bg-gray-100 rounded-lg">
                  <FileText className="h-16 w-16 text-primary" />
                  <p className="text-sm mt-2">{minFileName}</p>
                </div>
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = downloadLink;
                    link.download = minFileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full text-sm"
                >
                  <Download className="mr-2 h-4 w-4" /> Download Compressed PDF
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            className="px-8 py-4 text-lg font-semibold"
            disabled={!file || state === "loading"}
            onClick={onSubmit}
          >
            {state === "loading" ? "Compressing..." : "Compress PDF"}
          </Button>
        </div>

        {error && (
          <div className="mt-6 text-red-500">
            <p>{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}