import { useState, useEffect, useRef } from "react";
import {
  FaSpinner,
  FaLeaf,
  FaTimesCircle,
  FaCheckCircle,
  FaUpload,
  FaInfoCircle,
  FaExclamationTriangle,
  FaSearch,
  FaStethoscope,
  FaVirus,
  FaVirusSlash,
  FaViruses,
} from "react-icons/fa";

export default function TomatoClassifierForm() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const [useBinaryFilter, setUseBinaryFilter] = useState(true);

  // Create and clean up preview URL when file changes
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileValidation(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileValidation(e.target.files[0]);
    }
    e.target.value = "";
  };

  const handleFileValidation = (selectedFile) => {
    setError(null);
    setResult(null);

    if (!selectedFile.type.match(/image\/(png|jpeg|jpg)/)) {
      setError("Only PNG, JPG, or JPEG images are allowed.");
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      setError("File size must be less than 2MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `http://localhost:5000/classify?use_binary_for_filter=${useBinaryFilter}`,
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data?.detail ||
            data?.error ||
            `HTTP error! Status: ${response.status}`
        );
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err.name === "AbortError"
          ? "Request timed out. Please try again."
          : err.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    inputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // Format confidence as percentage
  const formatConfidence = (confidence) => {
    return (confidence * 100).toFixed(1) + "%";
  };

  // Format disease name for display
  const formatDiseaseName = (disease) => {
    return disease
      .replace("Tomato_", "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get severity color based on disease type
  const getSeverityColor = (disease) => {
    if (disease.includes("Late_blight")) return "red";
    if (disease.includes("Early_blight")) return "orange";
    if (disease.includes("Leaf_Mold")) return "amber";
    return "green"; // For healthy leaves
  };

  const getSeverityIcon = (disease) => {
    if (disease.includes("Late_blight"))
      return <FaViruses className="text-red-600" />;
    if (disease.includes("Early_blight"))
      return <FaVirus className="text-orange-500" />;
    if (disease.includes("Leaf_Mold"))
      return <FaVirusSlash className="text-amber-500" />;
    return <FaCheckCircle className="text-green-600" />;
  };

  // Get severity level text
  const getSeverityText = (disease) => {
    if (disease.includes("Late_blight")) return "High Severity";
    if (disease.includes("Early_blight")) return "Moderate Severity";
    if (disease.includes("Leaf_Mold")) return "Low Severity";
    return "Healthy Plant";
  };

  // Get disease information
  const getDiseaseInfo = (disease) => {
    if (disease.includes("Late_blight")) {
      return {
        description:
          "Late blight is a serious fungal disease that can destroy entire tomato crops. It thrives in cool, wet conditions and spreads rapidly.",
        recommendations: [
          "Remove and destroy infected leaves immediately",
          "Apply copper-based fungicides as preventive measure",
          "Avoid overhead watering",
          "Ensure proper plant spacing for air circulation",
        ],
      };
    }
    if (disease.includes("Early_blight")) {
      return {
        description:
          "Early blight is a common fungal disease characterized by concentric rings on leaves. It typically appears on older leaves first.",
        recommendations: [
          "Remove affected leaves",
          "Apply fungicides containing chlorothalonil",
          "Water at the base of plants",
          "Rotate crops annually",
        ],
      };
    }
    if (disease.includes("Leaf_Mold")) {
      return {
        description:
          "Leaf mold is a fungal disease that develops in humid conditions, causing yellow spots on upper leaf surfaces and fuzzy mold underneath.",
        recommendations: [
          "Reduce humidity and improve ventilation",
          "Remove infected leaves",
          "Apply fungicides if necessary",
          "Avoid crowding plants",
        ],
      };
    }
    return {
      description:
        "Your tomato plant appears healthy with no signs of disease. Continue with good cultural practices to maintain plant health.",
      recommendations: [
        "Monitor plants regularly for early signs of disease",
        "Water at the base of plants",
        "Maintain proper spacing for air circulation",
        "Practice crop rotation",
      ],
    };
  };

  return (
    <div
      className={`w-full md:w-3/4 lg:w-2/3 xl:w-1/2 mx-auto my-8 p-6 sm:p-10 rounded-2xl bg-white shadow-lg min-h-[30rem] ${
        isLoading ? "opacity-75 pointer-events-none" : ""
      }`}
    >
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 flex justify-center items-center text-green-600">
        <FaLeaf className="mr-3" />
        Tomato Disease Classifier
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        onDragEnter={!isLoading ? handleDrag : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,image/png,image/jpg,image/jpeg"
          onChange={!isLoading ? handleFileChange : undefined}
          className="hidden"
          disabled={isLoading}
        />

        {!file && (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-green-400"
            } ${isLoading ? "cursor-not-allowed" : ""}`}
            onDragEnter={!isLoading ? handleDrag : undefined}
            onDragLeave={!isLoading ? handleDrag : undefined}
            onDragOver={!isLoading ? handleDrag : undefined}
            onDrop={!isLoading ? handleDrop : undefined}
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              <FaUpload className="text-4xl text-gray-400" />
              <p className="text-gray-600">
                {dragActive
                  ? "Drop your tomato leaf image here"
                  : "Drag & drop your image here or"}
              </p>
              <button
                type="button"
                onClick={!isLoading ? onButtonClick : undefined}
                disabled={isLoading}
                className={`px-4 py-2 ${
                  isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-green-50 hover:bg-green-100 text-green-700"
                } font-medium rounded-lg transition flex items-center border ${
                  isLoading ? "border-gray-200" : "border-green-200"
                }`}
              >
                <FaUpload className="mr-2 text-sm" />
                Select Image
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: PNG, JPG (max 2MB)
              </p>
            </div>
          </div>
        )}

        {/* Image preview with loading skeleton */}
        {previewUrl && (
          <div className="border-2 border-dashed border-green-400 rounded-xl p-4 mt-4 flex flex-col items-center">
            <div className="relative w-full flex justify-center">
              <div className="max-w-full max-h-[400px] overflow-hidden flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="object-contain max-h-[400px] rounded-lg"
                  onLoad={() => URL.revokeObjectURL(previewUrl)}
                />
              </div>
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-lg">
                  <FaSpinner className="animate-spin text-white text-2xl" />
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-3 w-full justify-center">
              <button
                type="button"
                onClick={!isLoading ? handleRemoveImage : undefined}
                disabled={isLoading}
                className={`px-4 py-2 ${
                  isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-red-50 hover:bg-red-100 text-red-700"
                } rounded-lg flex items-center transition-colors font-medium border ${
                  isLoading ? "border-gray-200" : "border-red-200"
                }`}
              >
                <FaTimesCircle className="mr-2" /> Remove Image
              </button>
              <button
                type="button"
                onClick={!isLoading ? onButtonClick : undefined}
                disabled={isLoading}
                className={`px-4 py-2 ${
                  isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-700"
                } rounded-lg flex items-center transition-colors font-medium border ${
                  isLoading ? "border-gray-200" : "border-blue-200"
                }`}
              >
                <FaUpload className="mr-2" /> Change Image
              </button>
            </div>
          </div>
        )}
        {/* Binary classification toggle */}
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          <input
            type="checkbox"
            id="useBinaryFilter"
            checked={useBinaryFilter}
            onChange={(e) => setUseBinaryFilter(e.target.checked)}
            disabled={isLoading}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <label htmlFor="useBinaryFilter" className="cursor-pointer">
            Use binary classifier for tomato leaf filtering
          </label>
        </div>

        <div className="flex flex-col space-y-4">
          <button
            type="submit"
            disabled={isLoading || !file}
            className={`w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all flex justify-center items-center space-x-2 ${
              isLoading || !file
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-md"
            } ${isLoading ? "cursor-wait" : ""}`}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <FaLeaf />
                <span>Detect Disease</span>
              </>
            )}
          </button>

          {file && !isLoading && (
            <button
              type="button"
              onClick={!isLoading ? handleRemoveImage : undefined}
              disabled={isLoading}
              className={`w-full py-2 px-4 ${
                isLoading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              } font-medium rounded-lg transition flex justify-center items-center space-x-2 border ${
                isLoading ? "border-gray-200" : "border-gray-300"
              }`}
            >
              <FaTimesCircle />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start border border-red-200 relative">
          <FaExclamationTriangle className="mt-1 mr-3 flex-shrink-0 text-red-500" />
          <div className="pr-6">
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={!isLoading ? () => setError(null) : undefined}
            disabled={isLoading}
            className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-xl"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      )}

      {/* Classification Result */}
      {result && !error && (
        <div className="mt-6 p-6 rounded-lg shadow-sm bg-white border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FaLeaf className="mr-2 text-green-600" />
            Analysis Results
          </h3>

          <div className="space-y-5">
            <div
              className={`p-4 rounded-lg border-l-4 bg-${getSeverityColor(
                result.class
              )}-50 border-${getSeverityColor(result.class)}-200`}
            >
              <div className="flex items-center gap-2 mb-1">
                {getSeverityIcon(result.class)}
                <span className="font-semibold">
                  {formatDiseaseName(result.class)}
                </span>
                <span className="ml-auto font-bold">
                  {formatConfidence(result.confidence)}
                </span>
              </div>

              <div className="text-xs font-medium text-gray-500 mb-2">
                {getSeverityText(result.class)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    result.class.includes("healthy")
                      ? "bg-green-600"
                      : result.class.includes("Late_blight")
                      ? "bg-red-600"
                      : result.class.includes("Early_blight")
                      ? "bg-orange-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${result.confidence * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800 border border-blue-200">
              <div className="flex items-start">
                <FaInfoCircle className="mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">About this condition:</p>
                  <p>{getDiseaseInfo(result.class).description}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg text-sm text-amber-800 border border-amber-200">
              <div className="flex items-start">
                <FaExclamationTriangle className="mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Recommended actions:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {getDiseaseInfo(result.class).recommendations.map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      {!file && !error && !result && (
        <div className="mt-6 p-4 bg-gray-50 text-gray-700 rounded-lg border border-gray-200">
          <div className="flex items-start">
            <FaInfoCircle className="mt-0.5 mr-2 flex-shrink-0 text-gray-500" />
            <div>
              <p className="font-medium">How to use:</p>
              <ol className="list-decimal pl-5 space-y-1 mt-1">
                <li>Upload a clear photo of a tomato leaf</li>
                <li>Click "Detect Disease" to detect diseases</li>
                <li>View results and treatment recommendations</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
