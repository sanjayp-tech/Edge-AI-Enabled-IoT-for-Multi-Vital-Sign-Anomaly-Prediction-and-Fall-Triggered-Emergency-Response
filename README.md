# Edge-AI-Enabled-IoT-for-Multi-Vital-Sign-Anomaly-Prediction-and-Fall-Triggered-Emergency-Response
Project Overview

This project presents an Edge AI-powered IoT healthcare monitoring system designed to continuously track multiple vital signs and detect anomalies in real time. The system also includes fall detection and triggers an emergency response when abnormal conditions are identified.

we aims to enhance patient safety by providing instant alerts and reducing response time during critical situations.

⸻

🎯 Key Features

* 📡 Real-time monitoring of vital signs (e.g., heart rate, temperature, etc.)
* 🧠 Edge AI-based anomaly prediction
* 🚨 Fall detection system using sensor data
* 📲 Automatic emergency alerts/notifications
* 🌐 Web-based dashboard for monitoring (Flask-based)
* ⚡ Low latency processing using edge computing

⸻

🛠️ Technologies Used

* Programming Language: Python
* Framework: Flask
* Machine Learning: Scikit-learn / TensorFlow (if applicable)
* IoT Components: Sensors (Heart Rate, Accelerometer, etc.)
* Frontend: HTML, CSS, JavaScript
* Backend: Flask Server**

*  📂 Project Structure

iot-health-monitor/
│
├── app.py                 # Main application file
├── requirements.txt       # Dependencies
├── README.md              # Documentation
│
├── templates/             # HTML files
├── static/                # CSS, JS, images
├── instance/              # Database/config (optional)
├── models/                # ML models
└── data/                  # Dataset (optional)

CODE 
git clone https://github.com/your-username/iot-health-monitor.git
cd iot-health-monitor

*CREATE VIRTUAL ENVIRONMENT 
python -m venv venv

* ACTIVE ENVIRONMENT
venv\Scripts\activate

*INSTALL 
pip install -r requirements.txt

* RUN THE APPLICATION
  python app.py

*OPEN IN BROSWER
http://127.0.0.1:5000/
