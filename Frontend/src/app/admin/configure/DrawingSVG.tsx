import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MenuItem, Select, Button } from "@mui/material";
import { SelectChangeEvent } from '@mui/material/Select';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '@/config/constants';


interface DrawingSVGProps {
  imageUrl: string;
  onCoordinatesSave: () => void;
  cameraId: string; // New prop for camera_id
}

const GATE_API_URL = `${API_BASE_URL}/gate`;
const WRONG_PARKING_API_URL = `${API_BASE_URL}/wrong_parking`;

const DrawingSVG: React.FC<DrawingSVGProps> = ({ imageUrl, onCoordinatesSave, cameraId }) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [shape, setShape] = useState('rectangle');
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [endX, setEndX] = useState(0);
  const [endY, setEndY] = useState(0);
  const [lines, setLines] = useState<{ startX: number; startY: number; endX: number; endY: number }[]>([]);
  const [lineDirection, setLineDirection] = useState<string>('entry');
  const [rectangles, setRectangles] = useState<{ startX: number; startY: number; endX: number; endY: number }[]>([]);
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
  const [canvasWidth, setCanvasWidth] = useState<number>(0);
  const [canvasHeight, setCanvasHeight] = useState<number>(0);
  const [customId, setCustomId] = useState<string>(''); // New state for custom ID
  const [coordinates, setCoordinates] = useState<any[]>([]);

  const imageRef = useRef<HTMLImageElement | null>(null);


  useEffect(() => {
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setCanvasWidth(rect.width);
      setCanvasHeight(rect.height);
    }
  }, [canvas]);

  const redraw = useCallback(() => {
    if (ctx) {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx.drawImage(imageRef.current!, 0, 0, canvas!.width, canvas!.height);

      if (shape === 'rectangle') {
        rectangles.forEach(rect => {
          ctx.beginPath();
          ctx.rect(rect.startX, rect.startY, rect.endX - rect.startX, rect.endY - rect.startY);
          ctx.stroke();
        });
      } else if (shape === 'line') {
        lines.forEach(line => {
          ctx.beginPath();
          ctx.moveTo(line.startX, line.startY);
          ctx.lineTo(line.endX, line.endY);
          ctx.stroke();
        });
      } else if (shape === 'polygon') {
        drawPolygon();
      }
    }
  }, [canvas, ctx, shape, rectangles, lines]);

  useEffect(() => {
    const redrawCallback = () => {
      if (ctx) {
        redraw();
      }
    };
  
    if (canvas) {
      setCtx(canvas.getContext('2d')!);
      imageRef.current = new Image();
      imageRef.current.onload = redrawCallback;
      imageRef.current.src = imageUrl;
    }
  }, [canvas, ctx, imageUrl, redraw]);



  useEffect(() => {
    if (ctx && coordinates.length > 0) {
      coordinates.forEach(coordinate => {
        ctx.beginPath();
        ctx.moveTo(coordinate.startX, coordinate.startY);
        ctx.lineTo(coordinate.endX, coordinate.endY);
        ctx.strokeStyle = 'red';
        ctx.stroke();
      });
    }
  }, [ctx, coordinates]);


  
  useEffect(() => {
    if (ctx && imageRef.current && imageRef.current.complete) {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx.drawImage(imageRef.current, 0, 0, canvas!.width, canvas!.height);
    }
  }, [canvas, ctx, imageUrl]);

  const startShape = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const rect = canvas!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (shape === 'rectangle') {
      setStartX(x);
      setStartY(y);
    } else if (shape === 'line') {
      setLines([...lines, { startX: x, startY: y, endX: x, endY: y }]);
    } else if (shape === 'polygon') {
      setPolygonPoints([...polygonPoints, { x, y }]);
    }
  };

  const drawShape = (e: React.MouseEvent) => {
    if (!isDrawing) return;
  const rect = canvas!.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (shape === 'rectangle') {
    setEndX(x);
    setEndY(y);
    if (ctx) {
      ctx.strokeStyle = 'red';
    }
    redraw();
  } else if (shape === 'line') {
    const updatedLines = [...lines];
    updatedLines[updatedLines.length - 1].endX = x;
    updatedLines[updatedLines.length - 1].endY = y;
    setLines(updatedLines);
    
    // Set stroke style to red before drawing the line
    if (ctx) {
      ctx.strokeStyle = 'red';
    }

    redraw();
  } else if (shape === 'polygon') {

    if (ctx) {
      ctx.strokeStyle = 'red';
    }
    redraw();
    drawPolygonPoint(x, y);
  }
  };

  const endShape = () => {
    setIsDrawing(false);
    if (shape === 'rectangle') {
      setRectangles([...rectangles, { startX, startY, endX, endY }]);
    } else if (shape === 'polygon') {
      drawPolygon();
    }
  };

  const drawPolygonPoint = (x: number, y: number) => {
    if (ctx) {
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const drawPolygon = () => {
    if (ctx && polygonPoints.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  };

  const convertToRange = (x: number, y: number) => {
    const normalizedX = x / canvasWidth;
    const normalizedY = y / canvasHeight;
    return { x: normalizedX, y: normalizedY };
  };

  const handleIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomId(event.target.value);
  };

  const getCoordinates = () => {
    let coordinates: any[] = [];
    const idToUse = customId.trim() !== '' ? customId : generateTimestampId();

    if (shape === 'rectangle') {
      rectangles.forEach(rect => {
        // Calculate normalized coordinates and dimensions
        const x1 = convertToRange(rect.startX, rect.startY).x;
        const y1 = convertToRange(rect.startX, rect.startY).y;
        const x2 = convertToRange(rect.endX, rect.startY).x; // Use startY to calculate x2
        const y2 = convertToRange(rect.startX, rect.endY).y; // Use endY to calculate y2
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);
        
        // Push rectangle data into coordinates array
        coordinates.push({
          id: idToUse,
          roi: {
            // start_x : {
              x1: x1,
              y1: y1,
            // },
            // start_y : {
            //   x2: x2,
            //   y2: y2,
            // },
            width: width,
            height: height,
          },
        });
      });
      // Send coordinates to the server
      sendRecCoordinates(coordinates);
    } else if (shape === 'line') {
      if (lines.length === 2) {
        // Push line data into coordinates array
        coordinates.push({
          type: lineDirection, // Include the selected direction in the payload
          id: idToUse,
          trip_line: [
            convertToRange(lines[0].startX, lines[0].startY),
            convertToRange(lines[0].endX, lines[0].endY),
          ],
          dir_line: [
            convertToRange(lines[1].startX, lines[1].startY),
            convertToRange(lines[1].endX, lines[1].endY),
          ],
        });
        // Send coordinates to the server
        sendCoordinates(coordinates);
      } else {
        alert('Please draw 1 trip line and 1 direction line');
      }
    } else if (shape === 'polygon') {
      // Push polygon data into coordinates array
      coordinates.push({
        type: 'polygon',
        id: idToUse,
        trip_line: polygonPoints.map(point => convertToRange(point.x, point.y)),
        dir_line: [],
      });
      // Send coordinates to the server
      sendCoordinates(coordinates);
    }
  };

  const sendCoordinates = async (coordinates: any[]) => {
    const apiUrl = `${GATE_API_URL}/${cameraId}`;
    // const proxyUrl = "https://cors-anywhere.herokuapp.com/";

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

      onCoordinatesSave(); // Optionally trigger any further action on successful coordinates send
      location.reload();
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

  const sendRecCoordinates = async (coordinates: any[]) => {
    const apiUrl = `${WRONG_PARKING_API_URL}/${cameraId}`;
    // const proxyUrl = "https://cors-anywhere.herokuapp.com/";
    
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

      onCoordinatesSave(); // Optionally trigger any further action on successful coordinates send
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

  const handleChange = (event: SelectChangeEvent<string>) => {
    setShape(event.target.value);
    setPolygonPoints([]); // Reset polygonPoints when shape is changed
    setLines([]); // Reset lines when shape is changed
    setRectangles([]); // Reset rectangles when shape is changed
  };

  const handleLineDirectionChange = (event: SelectChangeEvent<string>) => {
    setLineDirection(event.target.value);
  };
  
  const generateTimestampId = () => {
    return `roi_${Date.now()}`;
  };

  const clearCanvas = () => {
    setLines([]);
    setPolygonPoints([]);
    setRectangles([]);

    if (ctx) {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      if (imageRef.current) {
        ctx.drawImage(imageRef.current, 0, 0, canvas!.width, canvas!.height);
      }
    }
  };

  return (
    <div>
     <canvas
        id="myCanvas"
        width="730"
        height="300"
        ref={(node) => setCanvas(node)}
        onMouseDown={startShape}
        onMouseMove={drawShape}
        onMouseUp={endShape}
        style={{ border: '1px solid black' }}
      ></canvas>
      <Select
        id="shapeSelect"
        value={shape}
        onChange={handleChange}
        style={{ marginTop: '2px', border: '1px solid #ccc' }}
      >
        <MenuItem value="rectangle">Rectangle</MenuItem>
        <MenuItem value="line">Line</MenuItem>
        <MenuItem value="polygon">Polygon</MenuItem>
      </Select>
      {shape === 'line' && (
        <Select
          id="lineDirectionSelect"
          value={lineDirection}
          onChange={handleLineDirectionChange}
          style={{ marginTop: '2px', border: '1px solid #ccc' }}
        >
          <MenuItem value="entry">Entry</MenuItem>
          <MenuItem value="exit">
          Exit</MenuItem>
          <MenuItem value="wrong_direction">Wrong Direction</MenuItem>
        </Select>
      )}
      <input
        type="text"
        placeholder="Enter ID"
        value={customId}
        onChange={handleIdChange}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        style={{ marginTop: '2px', marginLeft: '8px', border: '1px solid #ccc', padding: '5px' }}
      />

      <Button onClick={clearCanvas}>Clear</Button>
      <Button
        variant="contained"
        style={{ marginTop: '2px', padding: '6px 16px', backgroundColor: '#1976D2', color: 'white', float: 'right' }}
        onClick={getCoordinates}
      >
        Save Coordinates
      </Button>
    </div>
  );
};

export default DrawingSVG;
