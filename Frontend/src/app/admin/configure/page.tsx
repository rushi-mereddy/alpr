"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  Typography,
  Button,
  Modal,
  TextField,
} from "@mui/material";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import Logo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";
import DrawingSVG from "./DrawingSVG";
import CircularProgress from '@mui/material/CircularProgress';
import { API_BASE_URL } from "@/config/constants";

interface CameraData {
  camera_id: string;
  rtsp_url: string;
  algorithm: string;
  gate: any[]; // You might want to specify the type for gate, wrong_parking, and wrong_direction arrays
  wrong_parking: any[];
  wrong_direction: any[];
}

const CONFIG_ENDPOINT = `${API_BASE_URL}/config`;
const CONFIG_LIST_ENDPOINT = `${CONFIG_ENDPOINT}/all`;
const GATE_ENDPOINT = `${API_BASE_URL}/gate`;
const FRAME_ENDPOINT = `${API_BASE_URL}/get_frame`;

const Config = () => {
  const [isImageConfigModalOpen, setImageConfigModalOpen] = useState(false);
  const [isDrawingModalOpen, setDrawingModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<{
    camera_id: string;
    rtsp_url: string;
  } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ x: number; y: number }[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [cameraDetails, setCameraDetails] = useState({
    camera_id: "",
    rtsp_url: "",
  });

  const [cameras, setCameras] = useState<CameraData[]>([]);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    // Reset cameraDetails when closing the modal
    setCameraDetails({ camera_id: "", rtsp_url: "" });
  };
  const handleSaveCamera = async () => {
    // Check if a camera is being edited
    const isEditing = selectedCamera !== null;
  
    // Create a simplified payload with only the required fields
    const simplifiedPayload: CameraData = {
      camera_id: cameraDetails.camera_id,
      rtsp_url: cameraDetails.rtsp_url,
      algorithm: "alpr",
      gate: [],
      wrong_parking: [],
      wrong_direction: [],
    };
  
    try {
      // Save the camera data to the API
      await saveCameraToApi(simplifiedPayload);
  
      if (isEditing) {
        // Update the existing camera data
        const updatedCameras = cameras.map((camera) =>
          camera.camera_id === selectedCamera.camera_id ? simplifiedPayload : camera
        );
        setCameras(updatedCameras);
      } else {
        // Update the state with the new camera details
        const updatedCameras: CameraData[] = [...cameras, simplifiedPayload];
        setCameras(updatedCameras);
      }
  
      // Reset the camera details state
      setCameraDetails({ camera_id: "", rtsp_url: "" });
      handleCloseModal();
    } catch (error) {
      // console.error("Error saving camera data:", error.message);
      // Handle errors
      toast.error('Failed to save camera data', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };
  

  const handleOpenImageConfigModal = async (camera: { camera_id: string; rtsp_url: string } | null) => {
    if (!camera) {
      return;
    }
  
    setLoading(true);

    const rtspUrl = camera.rtsp_url;
    const getImageApiUrl = `${FRAME_ENDPOINT}?rtsp_url=${encodeURIComponent(rtspUrl)}`;
  
    try {
      // Fetch the image from the RTSP stream
      const response = await fetch(getImageApiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image from the RTSP stream');
        setLoading(false);
      }
  
      // Convert the received image to PNG format
      const blob = await response.blob();
      const convertedImage = await blobToBase64(blob);
  
      // Save the converted image to local storage
      // localStorage.setItem('cameraImage', convertedImage);
      localStorage.setItem('cameraImage', convertedImage as string);

      // Open the drawing modal with the converted image
      setSelectedImage(convertedImage as string);
      setDrawingModalOpen(true);
      setSelectedCamera(camera); // Set selected camera for sending camera_id
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching image:', error.message);
      setLoading(false);
      // Handle error
    }
  };

  // Function to convert blob to base64
  const blobToBase64 = (blob: Blob) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read blob as base64'));
        }
      };
      reader.readAsDataURL(blob);
    });
  };
  

useEffect(() => {
  return () => {
    localStorage.removeItem('cameraImage');
  };
}, []);

  const handleCloseImageConfigModal = () => {
    setImageConfigModalOpen(false);
  };

  const handleSubmitImage = (image: string) => {
    const imageUrl = "https://d27p8o2qkwv41j.cloudfront.net/wp-content/uploads/2017/10/shutterstock_521926666-e1508347182482.jpg";
    setSelectedImage(imageUrl);
    setDrawingModalOpen(true);
  };

  const handleCloseDrawingModal = () => {
    setDrawingModalOpen(false);
    setCoordinates([]); // Clear coordinates after closing the modal
  };

  const handleSaveCoordinates = async () => {
    if (!selectedCamera) {
      console.error("No selected camera.");
      return;
    }

    // Send camera_id in the API URL
    const apiUrl = `${GATE_ENDPOINT}/${selectedCamera.camera_id}`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(coordinates),
      });

      if (!response.ok) {
        throw new Error("Failed to send coordinates");
      }

      toast.success('Coordinates sent successfully!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      // Optionally trigger any further action on successful coordinates send
      handleCloseDrawingModal();
    } catch (error: any) {
      console.error("Error sending coordinates:", error.message);
      toast.error('Failed to send coordinates', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };



  // Function to send camera data to the API
  const saveCameraToApi = async (cameraData: CameraData) => {
    const sendApiUrl = CONFIG_ENDPOINT;
    try {
      const response = await fetch(sendApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add any other headers required by your API
        },
        body: JSON.stringify(cameraData),
      });

      if (!response.ok) {
        throw new Error("Failed to save camera data");
      }

      // Handle success
      toast.success('Camera data saved successfully!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error: any) {
      console.error("Error saving camera data:", error.message);
      // Handle errors
      toast.error('Failed to save camera data', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };


  useEffect(() => {
    // Fetch existing cameras from the API
    const fetchCameras = async () => {
      setLoading(true);
      try {
        const response = await fetch(CONFIG_LIST_ENDPOINT);
        if (!response.ok) {
          throw new Error("Failed to fetch cameras");
        }
        const data = await response.json();
        setCameras(data);
      } catch (error: any) {
        toast.error('Failed to fetch cameras', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } finally {
        setLoading(false); // Stop loading
      }
    };
    fetchCameras();
  }, []);


    // Function to fetch coordinates based on camera ID
    useEffect(() => {
      const fetchCoordinates = async () => {
        if (!selectedCamera) return;
        const camera = cameras.find(cam => cam.camera_id === selectedCamera?.camera_id);
        if (!camera) return;
        const coordinates = camera.gate.map(({ id }) => id);
        setCoordinates(coordinates);
      };
      fetchCoordinates();
    }, [selectedCamera, cameras]);


     // Function to delete a camera
  const handleDeleteCamera = async (cameraId: string) => {
    const deleteUrl = `${CONFIG_ENDPOINT}/${cameraId}`;
    try {
      const response = await fetch(deleteUrl, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete camera");
      }

      const updatedCameras = cameras.filter((camera) => camera.camera_id !== cameraId);
      setCameras(updatedCameras);

      toast.success('Camera deleted successfully!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error: any) {
      console.error("Error deleting camera:", error.message);
      toast.error('Failed to delete camera', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };
  

  const handleDeleteCoordinate = async (coordinate: { x: number; y: number }) => {
      if (!selectedCamera || !coordinate) {
        console.error("No selected camera or coordinate.");
        return;
      }
    
      const { camera_id } = selectedCamera;
      const gate_id = coordinate;
    
      const deleteUrl = `${GATE_ENDPOINT}/${camera_id}/${gate_id}`;
    
      try {
        const response = await fetch(deleteUrl, {
          method: "DELETE",
        });
    
        if (!response.ok) {
          throw new Error("Failed to delete coordinate");
        }
    
        // Update the coordinates state after successful deletion
        const updatedCoordinates = coordinates.filter(
          (coord) => coord !== coordinate
        );
        setCoordinates(updatedCoordinates);
    
        toast.success('Coordinate deleted successfully!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } catch (error: any) {
        console.error("Error deleting coordinate:", error.message);
        toast.error('Failed to delete coordinate', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    };
    
  return (
    <PageContainer title="Config" description="this is Config page">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', zIndex: 1 }}>
          <CircularProgress />
        </div>
      ) : (
      <Box
        sx={{
          position: "relative",
          "&:before": {
            content: '""',
            animation: "gradient 15s ease infinite",
            position: "absolute",
            height: "100%",
            width: "100%",
            opacity: "0.3",
          },
        }}
      >
        <Grid
          container
          spacing={0}
          justifyContent="center"
          sx={{ height: "100vh" }}
        >
          <Grid
            item
            xs={12}
            sm={12}
            lg={10}
            xl={4}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Card
              elevation={9}
              sx={{ p: 4, zIndex: 1, width: "100%", m: 5}} 
            >
              <Box display="flex" alignItems="center" justifyContent="center">
                <Logo />
              </Box>

                <Grid container spacing={1}
                  xs={12}
                  sm={12}
                  lg={15}
                  xl={4}
                  >
                  {cameras.map((camera, index) => (
                    <Grid item key={index} xs={12} sm={6} md={4} lg={4}>
                      <Card
                        style={{
                          padding: "10px 8px",
                          textAlign: "center",
                          margin: "10px",
                          wordBreak: "break-all",
                        }}
                      >
                        <Typography variant="h6">{camera.camera_id}</Typography>
                        <p>{camera.rtsp_url}</p>
                        <Button
                          variant="outlined"
                          style={{
                            marginTop: "8px",
                            marginBottom: "15px",
                            marginRight: "8px",
                          }}
                          onClick={() => handleOpenImageConfigModal(camera)}
                        >
                          Configure
                        </Button>
                        {/* <Button
                          variant="outlined"
                          style={{
                            marginTop: "8px",
                            marginBottom: "15px",
                            marginRight: "8px",
                          }}
                          onClick={() => {
                            setCameraDetails({
                              camera_id: camera.camera_id,
                              rtsp_url: camera.rtsp_url,
                            });
                            handleOpenModal();
                          }}
                        >
                          Edit
                        </Button> */}
                        <Button
                          variant="outlined"
                          color="error"
                          style={{
                            marginTop: "8px",
                            marginBottom: "15px",
                            marginRight: "8px",
                          }}
                          onClick={() => handleDeleteCamera(camera.camera_id)}
                        >
                          Delete
                        </Button>
                      </Card>
                    </Grid>
                  ))}
                </Grid>


              <Button variant="contained" onClick={handleOpenModal}>
                Add Camera
              </Button>

              <Modal open={isModalOpen} onClose={handleCloseModal}>
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 300,
                    bgcolor: "background.paper",
                    boxShadow: 24,
                    p: 4,
                  }}
                >
                  <Typography
                    variant="h6"
                    style={{
                      marginTop: "8px",
                      marginBottom: "15px",
                    }}
                  >
                    {cameraDetails.camera_id ? "Edit Camera" : "Add Camera"}
                  </Typography>
                  <TextField
                    label="Camera camera_id"
                    value={cameraDetails.camera_id}
                    style={{
                      marginTop: "8px",
                      marginBottom: "15px",
                    }}
                    onChange={(e) =>
                      setCameraDetails({
                        ...cameraDetails,
                        camera_id: e.target.value,
                      })
                    }
                  />
                  <TextField
                    label="rtsp url"
                    value={cameraDetails.rtsp_url}
                    style={{
                      marginTop: "8px",
                      marginBottom: "15px",
                    }}
                    onChange={(e) =>
                      setCameraDetails({
                        ...cameraDetails,
                        rtsp_url: e.target.value,
                      })
                    }
                  />
                  <Button
                    variant="contained"
                    style={{
                      marginTop: "8px",
                      marginBottom: "15px",
                    }}
                    onClick={handleSaveCamera}
                  >
                    Save
                  </Button>
                </Box>
              </Modal>

              <Modal
                open={isImageConfigModalOpen}
                onClose={handleCloseImageConfigModal}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 300,
                    bgcolor: "background.paper",
                    boxShadow: 24,
                    p: 4,
                  }}
                >
                  <Typography
                    variant="h6"
                    style={{
                      marginTop: "8px",
                      marginBottom: "15px",
                    }}
                  >
                    Image Configuration
                  </Typography>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) {
                        const imageUrl = URL.createObjectURL(selectedFile);
                        handleSubmitImage(imageUrl);
                      }
                    }}
                    style={{ marginBottom: "15px" }}
                  />
                  <Button
                    variant="contained"
                    style={{
                      marginTop: "8px",
                      marginBottom: "15px",
                    }}
                    onClick={() => handleCloseImageConfigModal()}
                  >
                    Submit
                  </Button>
                </Box>
              </Modal>

              {/* Drawing Modal */}
              <Modal open={isDrawingModalOpen} onClose={handleCloseDrawingModal}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 800,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                  }}
                >
                  <Typography
                    variant="h6"
                    style={{
                      marginTop: '8px',
                      marginBottom: '15px',
                    }}
                  >
                    Draw Lines
                  </Typography>
                  {/* Display the selected image */}
                  {/* console.log(selectedImage); */}
                  {selectedImage &&  (
                    <DrawingSVG
                      imageUrl={selectedImage}
                      onCoordinatesSave={() => setCoordinates(coordinates)}
                      cameraId={selectedCamera ? selectedCamera.camera_id : ''}
                    />
                  )}
                {/* Here comes the list of coordinates */}
                <ol>
                {coordinates.map((coordinate, index) => (
                  <li key={index}>
                    {`${coordinate} (${index})`}
                    <Button
                      variant="outlined"
                      color="error"
                      style={{marginLeft: '30px'}}
                      onClick={() => handleDeleteCoordinate(coordinate)}
                    >
                      Delete
                    </Button>
                  </li>
                ))}
                </ol>
                </Box>
              </Modal>
            </Card>
          </Grid>
        </Grid>
      </Box>
    )}
      <ToastContainer />
    </PageContainer>
  );
};

export default Config;
