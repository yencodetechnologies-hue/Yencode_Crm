import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projectServices } from '../../api/axios/axiosInstance';
import { PageShell, Card, Button, useToast } from '../ui';

const STEPS = ['Capture photo', 'Confirm', 'Submit'];

const EmployeeAttendance = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const employeeId = localStorage.getItem("empId");
  const [photo, setPhoto] = useState(null);
  const [attendanceDetails] = useState({
    employeeId: "",
    employeeName: "",
    date: new Date().toLocaleDateString('en-GB'),
    status: "Present",
    logintime: "",
  });
  const [submittedData, setSubmittedData] = useState(null);
  const [cameraState, setCameraState] = useState({
    isActive: false,
    isLoading: false,
    error: null
  });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject = null;
    }
    setCameraState(prev => ({ ...prev, isActive: false, isLoading: false }));
  };

  const initializeCamera = async () => {
    if (cameraState.isLoading || cameraState.isActive || !isMounted) return;
    if (!videoRef.current) {
      setCameraState({ isActive: false, isLoading: false, error: "Camera not ready. Please try again." });
      return;
    }

    setCameraState({ isActive: false, isLoading: true, error: null });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => { videoRef.current.onloadedmetadata = resolve; });
        setCameraState({ isActive: true, isLoading: false, error: null });
      }
    } catch (error) {
      stopCamera();
      setCameraState({ isActive: false, isLoading: false, error: error.message || "Failed to access camera" });
    }
  };

  useEffect(() => {
    if (isMounted && !photo && !submittedData) initializeCamera();
  }, [isMounted, photo, submittedData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) stopCamera();
      else if (isMounted && !photo && !submittedData && !cameraState.isActive && !cameraState.isLoading) {
        initializeCamera();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isMounted, photo, submittedData, cameraState.isActive, cameraState.isLoading]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraState.isActive) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.width = 320;
      canvas.height = 240;
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      setPhoto(canvas.toDataURL("image/jpeg", 0.7));
      stopCamera();
    }
  };

  const recapturePhoto = () => {
    setPhoto(null);
    initializeCamera();
  };

  const currentStep = submittedData ? 3 : photo ? 2 : 1;

  const handleSubmit = async () => {
    if (!photo) {
      showToast("Please capture a photo before submitting.", "error");
      return;
    }

    setIsSubmitting(true);
    const currentDate = new Date();
    const submissionData = {
      photo,
      employeeId: employeeId || "Unknown",
      employeeName: attendanceDetails.employeeName || "Unknown",
      date: currentDate.toISOString().split('T')[0],
      status: "Present",
      logintime: currentDate.toLocaleTimeString(),
    };

    try {
      const response = await projectServices.post("/attendance/create", submissionData);
      if (response.status === 200 || response.status === 201) {
        showToast("Attendance submitted successfully!");
        setSubmittedData(response.data.attendance);
        setTimeout(() => navigate('/attendance-table'), 1500);
      } else {
        showToast("Failed to submit attendance.", "error");
      }
    } catch (error) {
      console.error("Error submitting attendance:", error);
      showToast("Error submitting attendance. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Mark Attendance"
      description="Capture your photo to check in for today"
    >
      {!submittedData && (
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i + 1 <= currentStep ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {i + 1}
                  </div>
                  <span className="text-xs text-slate-500 mt-1 hidden sm:block">{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-12 ${i + 1 < currentStep ? 'bg-primary' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <Card className="p-6">
            {cameraState.error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
                Camera Error: {cameraState.error}
              </div>
            )}

            <div className="flex justify-center mb-6">
              {!photo ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`fullscreen-video w-72 h-56 ${!cameraState.isActive ? 'hidden' : ''}`}
                  />
                  {cameraState.isLoading && (
                    <div className="w-72 h-56 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                      Initializing camera...
                    </div>
                  )}
                </div>
              ) : (
                <img src={photo} alt="Captured" className="w-48 h-48 rounded-full object-cover border-4 border-primary-light shadow-card" />
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex flex-wrap justify-center gap-3">
              {!photo && cameraState.isActive && (
                <Button onClick={capturePhoto}>
                  <Camera size={18} />
                  Capture Photo
                </Button>
              )}
              {photo && (
                <>
                  <Button variant="secondary" onClick={recapturePhoto}>
                    <Camera size={18} />
                    Recapture
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
                  </Button>
                </>
              )}
              {(cameraState.error || cameraState.isLoading) && !photo && (
                <Button variant="danger" onClick={initializeCamera} disabled={cameraState.isLoading}>
                  {cameraState.error ? 'Retry Camera' : 'Initializing...'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {submittedData && (
        <Card className="max-w-md mx-auto p-8 text-center">
          <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Attendance Recorded</h3>
          <p className="text-sm text-slate-500 mb-6">Redirecting to your attendance history...</p>
          <img
            src={submittedData.photo}
            alt="Captured"
            className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-primary-light"
          />
          <div className="grid grid-cols-2 gap-3 text-sm text-left">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-500">Employee ID</p>
              <p className="font-medium">{submittedData.employeeId}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-500">Status</p>
              <p className="font-medium text-primary">{submittedData.status}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-500">Date</p>
              <p className="font-medium">{submittedData.date}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-500">Login Time</p>
              <p className="font-medium">{submittedData.logintime}</p>
            </div>
          </div>
        </Card>
      )}
    </PageShell>
  );
};

export default EmployeeAttendance;
