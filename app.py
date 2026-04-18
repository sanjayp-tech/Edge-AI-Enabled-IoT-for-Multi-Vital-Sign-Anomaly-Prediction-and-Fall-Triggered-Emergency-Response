"""
IoT Health Monitoring Dashboard - Flask Backend
Real-time health monitoring system with IoT sensor data visualization
"""

from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import requests

app = Flask(__name__)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///health_data.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


class HealthReading(db.Model):
    """Model to store IoT health sensor readings"""
    id = db.Column(db.Integer, primary_key=True)
    temperature = db.Column(db.Float, nullable=False, default=0)
    heartbeat = db.Column(db.Float, nullable=False, default=0)
    spo2 = db.Column(db.Float, nullable=False, default=0)
    accelerometer = db.Column(db.Float, nullable=False, default=0)
    latitude = db.Column(db.Float, nullable=False, default=0)
    longitude = db.Column(db.Float, nullable=False, default=0)
    status = db.Column(db.String(50), nullable=False, default='UNKNOWN')
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'temperature': self.temperature,
            'heartbeat': self.heartbeat,
            'spo2': self.spo2,
            'accelerometer': self.accelerometer,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'status': self.status,
            'timestamp': self.timestamp.isoformat()
        }


# Create tables
with app.app_context():
    db.create_all()

# IoT API Configuration
IOT_API_URL = "http://mangocity.appblocky.com/webdb/getvalue.php?tag=chp0182"

def fetch_iot_data():
    """Fetch and parse data from IoT API"""
    try:
        response = requests.get(IOT_API_URL, timeout=5)
        data = response.json()
        
        # Parse the sensor values from the third element
        # Format: "Temperature,HeartBeat,SpO2,Accelerometer,Latitude,Longitude,Status"
        if len(data) >= 3:
            values = data[2].split(',')
            
            if len(values) >= 7:
                return {
                    "temperature": float(values[0]) if values[0] else 0,
                    "heartbeat": float(values[1]) if values[1] else 0,
                    "spo2": float(values[2]) if values[2] else 0,
                    "accelerometer": float(values[3]) if values[3] else 0,
                    "latitude": float(values[4]) if values[4] else 0,
                    "longitude": float(values[5]) if values[5] else 0,
                    "status": values[6] if values[6] else "UNKNOWN",
                    "success": True
                }
        
        return get_default_data()
        
    except Exception as e:
        print(f"Error fetching IoT data: {e}")
        return get_default_data()

def get_default_data():
    """Return default data when API is unavailable"""
    return {
        "temperature": 0,
        "heartbeat": 0,
        "spo2": 0,
        "accelerometer": 0,
        "latitude": 11.678102,
        "longitude": 78.124435,
        "status": "OFFLINE",
        "success": False
    }

@app.route('/')
def index():
    """Serve the main dashboard page"""
    return render_template('index.html')

@app.route('/api/data')
def get_data():
    """API endpoint to fetch parsed IoT sensor data and store in database"""
    data = fetch_iot_data()
    
    # Save to database if data was successfully fetched
    if data.get('success'):
        reading = HealthReading(
            temperature=data['temperature'],
            heartbeat=data['heartbeat'],
            spo2=data['spo2'],
            accelerometer=data['accelerometer'],
            latitude=data['latitude'],
            longitude=data['longitude'],
            status=data['status']
        )
        db.session.add(reading)
        db.session.commit()
    
    return jsonify(data)


@app.route('/api/history')
def get_history():
    """API endpoint to get historical health readings from database"""
    limit = request.args.get('limit', 100, type=int)
    readings = HealthReading.query.order_by(HealthReading.timestamp.desc()).limit(limit).all()
    return jsonify([reading.to_dict() for reading in readings])


@app.route('/api/history/count')
def get_history_count():
    """API endpoint to get total count of stored readings"""
    count = HealthReading.query.count()
    return jsonify({'count': count})

if __name__ == '__main__':
    print("=" * 60)
    print("  IoT Health Monitoring Dashboard")
    print("  Real-Time Patient Monitoring System")
    print("=" * 60)
    print("\n  Starting server at: http://localhost:5000")
    print("  Press Ctrl+C to stop the server\n")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)
