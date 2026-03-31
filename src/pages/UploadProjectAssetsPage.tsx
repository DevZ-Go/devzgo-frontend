import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, AlertCircle, Upload } from "lucide-react";
import { Navbar } from "../components/Navbar";
import {
  uploadProjectFiles,
  uploadProjectImage,
  uploadProjectVideo,
} from "../api/projects";
import { getApiErrorMessage } from "../utils/apiError";

export function UploadProjectAssetsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;

    setError(null);
    setLoading(true);
    try {
      if (image) await uploadProjectImage(id, image);
      if (video) await uploadProjectVideo(id, video);
      if (files) await uploadProjectFiles(id, files);

      navigate("/home", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <main className="max-w-2xl mx-auto px-8 pt-28 pb-16">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload project assets
          </h1>
          <p className="text-gray-600">
            Upload an image, a video, and any project files. These are saved
            on the backend server.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-3xl border border-gray-200/50 bg-white shadow-xl overflow-hidden p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-700">
                  Media & files
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project image (cover)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setImage(f);
                    }}
                    className="w-full text-sm text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project video
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setVideo(f);
                    }}
                    className="w-full text-sm text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project files (ZIP, PDF, docs, etc.)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                    className="w-full text-sm text-gray-700"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mt-5"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  disabled={loading || !id}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold disabled:opacity-60 disabled:pointer-events-none"
                >
                  {loading ? "Uploading..." : "Upload assets"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => navigate("/home")}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}

