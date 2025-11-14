from fastapi import FastAPI, HTTPException, Query
from pymongo import MongoClient
from pydantic import BaseModel, Field
from typing import List, Dict
from bson import ObjectId
from bson.json_util import dumps
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import cv2
from datetime import datetime, date
import os


app = FastAPI()

allowed_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
if not allowed_origins:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in allowed_origins else allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
mongo_uri = os.getenv("MONGODB_URI", "mongodb://mongo:27017/")
mongo_db = os.getenv("MONGODB_DB", "alpr")
client = MongoClient(mongo_uri)
db = client[mongo_db]
collection = db["camera_details"]


class Point(BaseModel):
    x: float
    y: float


class ROIStructure(BaseModel):
    x1: float
    y1: float
    width: float
    height: float


class WrongParkingROI(BaseModel):
    id: str
    roi: ROIStructure

class WrongParkingROI(BaseModel):
    id: str
    roi: ROIStructure


class GateROI(BaseModel):
    type: str
    id: str
    trip_line: List[Point]
    dir_line: List[Point]




class WrongDirectionROI(BaseModel):
    id: str
    trip_line: List[Point]
    dir_line: List[Point]

class CameraConfig(BaseModel):
    camera_id: str
    rtsp_url: str
    algorithm: str
    gate: List[GateROI]
    wrong_parking: List[WrongParkingROI]


class Payload(BaseModel):
    camera_id: int
    gate: dict
    vehicle: str
    plate_type: str = Field(..., description="Type of the plate (commercial, private)")
    license_plate: str
    plate_img: str
    timestamp: str = Field(..., description="Format: YYYY-MM-DD_HH:MM:SS")


class Alert(BaseModel):
    alert_type: str
    id: str
    vechile_no:str
    camera_id: int
    alert_img: str
    plate_img: str
    timestamp: str

@app.get("/config/all")
async def get_all_configs():
    cursor = collection.find({})
    configs = [doc for doc in cursor]
    return Response(content=dumps(configs), media_type="application/json")



@app.post("/config")
async def create_config(config: CameraConfig):
    existing_config = collection.find_one({"camera_id": config.camera_id})
    if existing_config:
        raise HTTPException(status_code=400, detail="Camera configuration with the same camera_id already exists")
    
    # Convert the Pydantic model to a dictionary
    config_dict = config.dict()

    # Insert the document into the MongoDB collection
    result = collection.insert_one(config_dict)

    return {"message": "Config created successfully", "inserted_id": str(result.inserted_id)}

@app.put("/config/{camera_id}")
async def update_rtsp_url(camera_id: str, rtsp_url: str):
    # Find the document in the MongoDB collection
    existing_config = collection.find_one({"camera_id": camera_id})
    
    # If no document was found, raise a 404 error
    if existing_config is None:
        raise HTTPException(status_code=404, detail="Config not found")
    
    # Update only the rtsp_url field
    result = collection.update_one(
        {"camera_id": camera_id},
        {"$set": {"rtsp_url": rtsp_url}}
    )
    
    # If no document was updated, raise a 404 error
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="RTSP URL not updated")
    
    return {"message": "RTSP URL updated successfully"}



@app.delete("/config/{camera_id}")
async def delete_config(camera_id: int):
    # Find and delete the document from the MongoDB collection
    result = collection.find_one_and_delete({"camera_id": camera_id})
    
    # If no document was deleted, raise a 404 error
    if result is None:
        raise HTTPException(status_code=404, detail="Config not found")
    
    return {"message": "Config deleted successfully"}


@app.post("/gate/{camera_id}")
async def update_gate_config(camera_id: str, gate_config: List[GateROI]):
    # Find the existing camera configuration
    existing_config = collection.find_one({"camera_id": camera_id})
    
    # If no existing configuration found, create a new one with the provided gate configurations
    if existing_config is None:
        new_config = {"camera_id": camera_id, "gate": [gate.dict() for gate in gate_config]}
        result = collection.insert_one(new_config)
        return {"message": "Gate configurations created successfully", "inserted_id": str(result.inserted_id)}
    
    # Otherwise, update the existing gate configurations with the provided ones
    else:
        updated_gate_config = existing_config.get("gate", []) + [gate.dict() for gate in gate_config]
        result = collection.update_one(
            {"camera_id": camera_id},
            {"$set": {"gate": updated_gate_config}}
        )
        return {"message": "Gate configurations updated successfully"}



@app.put("/gate/{camera_id}/{gate_id}")
async def update_gate_config(camera_id: str, gate_id: str, gate_config: GateROI):
    # Update the specific gate configuration for the specified camera ID and gate ID in the MongoDB collection
    result = collection.update_one(
        {"camera_id": camera_id, "gate.id": gate_id},
        {"$set": {"gate.$": gate_config.dict()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Gate configuration with ID {gate_id} not found for camera ID {camera_id}")
    return {"message": f"Gate configuration with ID {gate_id} updated successfully"}

@app.delete("/gate/{camera_id}/{gate_id}")
async def delete_gate_config(camera_id: str, gate_id: str):
    # Delete the specific gate configuration for the specified camera ID and gate ID from the MongoDB collection
    result = collection.update_one(
        {"camera_id": camera_id},
        {"$pull": {"gate": {"id": gate_id}}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail=f"Gate configuration with ID {gate_id} not found for camera ID {camera_id}")
    return {"message": f"Gate configuration with ID {gate_id} deleted successfully"}


@app.post("/wrong_parking/{camera_id}")
async def update_wrong_parking_config(camera_id: str, wrong_parking_config: List[WrongParkingROI]):
    # Iterate over the provided configurations
    for parking_config in wrong_parking_config:
        # Check if a configuration with the same ID already exists for the camera
        existing_config = collection.find_one({"camera_id": camera_id, "wrong_parking.id": parking_config.id})
        if existing_config:
            # Update the existing configuration
            result = collection.update_one(
                {"camera_id": camera_id, "wrong_parking.id": parking_config.id},
                {"$set": {"wrong_parking.$": parking_config.dict()}}
            )
            if result.modified_count == 0:
                raise HTTPException(status_code=404, detail=f"Failed to update configuration with ID {parking_config.id}")
        else:
            # Create a new configuration
            result = collection.update_one(
                {"camera_id": camera_id},
                {"$push": {"wrong_parking": parking_config.dict()}}
            )
            if result.modified_count == 0:
                raise HTTPException(status_code=404, detail="Failed to create new configuration")

    return {"message": "Wrong parking configurations updated successfully"}

@app.delete("/wrong_parking/{camera_id}/{wrong_parking_id}")
async def delete_wrong_parking_config(camera_id: str, wrong_parking_id: str):
    try:
        # Delete the specific wrong parking configuration for the specified camera ID and wrong parking ID from the MongoDB collection
        result = collection.update_one(
            {"camera_id": camera_id},
            {"$pull": {"wrong_parking": {"id": wrong_parking_id}}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail=f"Wrong parking configuration with ID {wrong_parking_id} not found for camera ID {camera_id}")
        return {"message": f"Wrong parking configuration with ID {wrong_parking_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/wrong_parking/{camera_id}/{wrong_parking_id}")
async def delete_gate_config(camera_id: str, wrong_parking_id: str):
    # Delete the specific gate configuration for the specified camera ID and gate ID from the MongoDB collection
    result = collection.update_one(
        {"camera_id": camera_id},
        {"$pull": {"wrong_parking": {"id": wrong_parking_id}}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail=f"wrong_parking_id configuration with ID {wrong_parking_id} not found for camera ID {camera_id}")
    return {"message": f"Wrong Parking configuration with ID {wrong_parking_id} deleted successfully"}


# Function to capture a single frame from the RTSP stream
def capture_frame(rtsp_url):
    cap = cv2.VideoCapture(rtsp_url)
    ret, frame = cap.read()
    cap.release()
    return frame

# Endpoint to get a single frame from the RTSP stream
@app.get("/get_frame")
async def get_frame(rtsp_url: str = Query(..., description="RTSP URL of the video stream")):
    frame = capture_frame(rtsp_url)
    if frame is None:
        return Response(content="Error capturing frame", status_code=500)
    ret, buffer = cv2.imencode('.jpg', frame)
    if not ret:
        return Response(content="Error encoding frame", status_code=500)
    return Response(content=buffer.tobytes(), media_type="image/jpeg")


@app.post("/store_data")
async def store_data(payload: Payload):
    try:
        collection = db["alpr_analytics"]
        # Add timestamp if not present in the payload
        # Insert payload into MongoDB collection
        result = collection.insert_one(payload.dict())

        if result.inserted_id:
            return {"message": "Data stored successfully", "id": str(result.inserted_id)}
        else:
            raise HTTPException(status_code=500, detail="Failed to store data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/vehicle_counts")
async def get_vehicle_counts():
    try:
        collection = db["alpr_analytics"]
        
        # Define vehicle types
        vehicle_types = ["car", "truck", "bicycle", "motorcycle", "autorickshaw"]
        
        # Initialize counts for each vehicle type and entry/exit
        vehicle_counts = {vehicle_type: {"count": 0, "entry_count": 0, "exit_count": 0} for vehicle_type in vehicle_types}
        entry_count = 0
        exit_count = 0
        
        # Aggregate query to count vehicles by type
        pipeline = [
            {"$match": {"vehicle": {"$in": vehicle_types}}},
            {"$group": {"_id": "$vehicle", "count": {"$sum": 1}}}
        ]
        counts = list(collection.aggregate(pipeline))
        
        # Update counts dictionary with vehicle counts
        for item in counts:
            vehicle_counts[item["_id"]]["count"] = item["count"]
        
        # Query to count entry and exit for each vehicle type
        for vehicle_type in vehicle_types:
            entry_exit_pipeline = [
                {"$match": {"vehicle": vehicle_type}},
                {"$group": {"_id": "$gate.type", "count": {"$sum": 1}}}
            ]
            entry_exit_counts = list(collection.aggregate(entry_exit_pipeline))
            
            # Update entry and exit counts for the current vehicle type
            for item in entry_exit_counts:
                if item["_id"] == "Entry":
                    vehicle_counts[vehicle_type]["entry_count"] = item["count"]
                elif item["_id"] == "Exit":
                    vehicle_counts[vehicle_type]["exit_count"] = item["count"]
        
        # Calculate overall entry and exit counts
        entry_count = sum(vehicle_counts[vehicle_type]["entry_count"] for vehicle_type in vehicle_types)
        exit_count = sum(vehicle_counts[vehicle_type]["exit_count"] for vehicle_type in vehicle_types)
        
        # Format the result
        result = []
        for vehicle_type, counts in vehicle_counts.items():
            result.append({
                "type": vehicle_type,
                "count": counts["count"],
                "entry_count": counts["entry_count"],
                "exit_count": counts["exit_count"]
            })
        result.extend([
            {"type": "entry_count", "count": entry_count},
            {"type": "exit_count", "count": exit_count}
        ])
        
        return Response(content=dumps(result), media_type="application/json")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@app.get("/vehicle_counts_today")
async def get_vehicle_counts_today():
    try:
        collection = db["alpr_analytics"]
        
        # Get today's date
        today_date = date.today()
        
        # Define vehicle types
        vehicle_types = ["car", "truck", "bicycle", "motorcycle", "autorickshaw"]
        
        # Initialize counts for each vehicle type and entry/exit
        vehicle_counts = {vehicle_type: {"count": 0, "entry_count": 0, "exit_count": 0} for vehicle_type in vehicle_types}
        entry_count = 0
        exit_count = 0
        notapplicable=0
        
        # Define the start and end of today
        start_of_day = today_date.strftime("%Y-%m-%d_00:00:00")
        end_of_day = today_date.strftime("%Y-%m-%d_23:59:59")
        
        # Aggregate query to count vehicles by type for today
        pipeline = [
            {"$match": {"$and": [{"vehicle": {"$in": vehicle_types}}, {"timestamp": {"$gte": start_of_day, "$lte": end_of_day}}]}},
            {"$group": {"_id": "$vehicle", "count": {"$sum": 1}}}
        ]
        counts = list(collection.aggregate(pipeline))
        
        # Update counts dictionary with vehicle counts for today
        for item in counts:
            vehicle_counts[item["_id"]]["count"] = item["count"]
        
        # Query to count entry and exit for each vehicle type for today
        for vehicle_type in vehicle_types:
            entry_exit_pipeline = [
                {"$match": {"$and": [{"vehicle": vehicle_type}, {"timestamp": {"$gte": start_of_day, "$lte": end_of_day}}]}},
                {"$group": {"_id": "$gate.type", "count": {"$sum": 1}}}
            ]
            entry_exit_counts = list(collection.aggregate(entry_exit_pipeline))
            
            # Update entry and exit counts for the current vehicle type for today
            for item in entry_exit_counts:
                if item["_id"] == "Entry":
                    vehicle_counts[vehicle_type]["entry_count"] = item["count"]
                elif item["_id"] == "Exit":
                    vehicle_counts[vehicle_type]["exit_count"] = item["count"]
                elif item["_id"] == "NotApplicable":
                    vehicle_counts[vehicle_type]["notapplicable"] = item["count"]
        
        # Calculate overall entry and exit counts for today
        entry_count = sum(vehicle_counts[vehicle_type]["entry_count"] for vehicle_type in vehicle_types)
        exit_count = sum(vehicle_counts[vehicle_type]["exit_count"] for vehicle_type in vehicle_types)
        notapplicable = sum(vehicle_counts[vehicle_type]["notapplicable"] for vehicle_type in vehicle_types)
        
        # Format the result
        result = []
        for vehicle_type, counts in vehicle_counts.items():
            result.append({
                "type": vehicle_type,
                "count": counts["count"],
                "entry_count": counts["entry_count"],
                "exit_count": counts["exit_count"]
            })
        result.extend([
            {"type": "entry_count", "count": entry_count},
            {"type": "exit_count", "count": exit_count},
            {"type": "N/A", "count": notapplicable}
        ])
        
        return Response(content=dumps(result), media_type="application/json")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/records_today")
async def get_records_today():
    try:
        collection = db["alpr_analytics"]
        # Get today's date
        today_date = date.today()
        
        # Define the start and end of today
        start_of_day = today_date.strftime("%Y-%m-%d_00:00:00")
        end_of_day = today_date.strftime("%Y-%m-%d_23:59:59")
        
        # Project only the required fields
        projection = {"vehicle": 1, "gate": 1, "timestamp": 1, "_id": 0}
        
        # Query records for today and project only required fields
        records_today = list(collection.find({
            "timestamp": {
                "$gte": start_of_day,
                "$lte": end_of_day
            }
        }, projection))
        
        return Response(content=dumps(records_today), media_type="application/json")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    
@app.get("/retrieve_data")
async def retrieve_data(page: int = Query(1, gt=0), perPage: int = Query(10, gt=0)):
    try:
        collection = db["alpr_analytics"]
        skip = (page - 1) * perPage
        cursor = collection.find({}).skip(skip).limit(perPage)
        configs = [doc for doc in cursor]
        return Response(content=dumps(configs), media_type="application/json")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# Route to handle inserting the payload
@app.post("/insert_alert")
async def insert_alert(alert: Alert):
    try:
        alerts_collection = db["alerts"]
        # Add timestamp if not provided
        if not alert.timestamp:
            alert.timestamp = datetime.now().strftime("%Y-%m-%d_%H:%M:%S")

        # Insert payload into MongoDB collection
        result = alerts_collection.insert_one(alert.dict())

        if result.inserted_id:
            return {"message": "Alert inserted successfully", "id": str(result.inserted_id)}
        else:
            raise HTTPException(status_code=500, detail="Failed to insert alert")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.get("/retrieve_alert")
async def retrieve_alert(page: int = Query(1, gt=0), perPage: int = Query(10, gt=0)):
    try:
        collection = db["alerts"]
        skip = (page - 1) * perPage
        cursor = collection.find({}).skip(skip).limit(perPage)
        alerts = [doc for doc in cursor]
        return Response(content=dumps(alerts), media_type="application/json")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

