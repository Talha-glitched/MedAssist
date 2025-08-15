// MongoDB initialization script for MediAssist
// This script runs when the MongoDB container starts for the first time

print('Initializing MediAssist database...');

// Switch to the MediAssist database
db = db.getSiblingDB('mediassist');

// Create collections with validation
db.createCollection('users', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["email", "password", "role"],
            properties: {
                email: {
                    bsonType: "string",
                    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
                },
                role: {
                    enum: ["doctor", "patient", "admin"]
                }
            }
        }
    }
});

db.createCollection('medicalnotes', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["doctorId", "patientName", "subjective", "objective", "assessment", "plan"],
            properties: {
                status: {
                    enum: ["draft", "pending", "approved", "rejected"]
                }
            }
        }
    }
});

db.createCollection('transcripts', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["text", "status"]
        }
    }
});

db.createCollection('patients', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "email"]
        }
    }
});

// Create indexes for better performance
print('Creating indexes...');

// Users collection indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });

// Medical notes collection indexes
db.medicalnotes.createIndex({ "doctorId": 1, "createdAt": -1 });
db.medicalnotes.createIndex({ "patientId": 1, "dateOfService": -1 });
db.medicalnotes.createIndex({ "status": 1 });
db.medicalnotes.createIndex({ "sessionId": 1 });

// Transcripts collection indexes
db.transcripts.createIndex({ "status": 1 });
db.transcripts.createIndex({ "createdAt": -1 });

// Patients collection indexes
db.patients.createIndex({ "email": 1 }, { unique: true });
db.patients.createIndex({ "patientId": 1 }, { unique: true });

// Create demo users if they don't exist
print('Creating demo users...');

const demoUsers = [
    {
        email: "doctor@demo.com",
        password: "$2b$10$rQZ8K9vX8K9vX8K9vX8K9O.8K9vX8K9vX8K9vX8K9vX8K9vX8K9vX8K9", // password123
        name: "Dr. John Smith",
        role: "doctor",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: "patient@demo.com",
        password: "$2b$10$rQZ8K9vX8K9vX8K9vX8K9O.8K9vX8K9vX8K9vX8K9vX8K9vX8K9vX8K9", // password123
        name: "Jane Doe",
        role: "patient",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: "admin@demo.com",
        password: "$2b$10$rQZ8K9vX8K9vX8K9vX8K9O.8K9vX8K9vX8K9vX8K9vX8K9vX8K9vX8K9", // password123
        name: "System Administrator",
        role: "admin",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

demoUsers.forEach(user => {
    const existingUser = db.users.findOne({ email: user.email });
    if (!existingUser) {
        db.users.insertOne(user);
        print(`Created demo user: ${user.email}`);
    } else {
        print(`Demo user already exists: ${user.email}`);
    }
});

// Create demo patients
print('Creating demo patients...');

const demoPatients = [
    {
        patientId: "P001",
        name: "Alice Johnson",
        email: "alice.johnson@email.com",
        phone: "+1-555-0101",
        age: 35,
        gender: "female",
        address: "123 Main St, City, State 12345",
        emergencyContact: {
            name: "Bob Johnson",
            phone: "+1-555-0102",
            relationship: "Spouse"
        },
        medicalHistory: ["Hypertension", "Diabetes Type 2"],
        allergies: ["Penicillin"],
        medications: ["Lisinopril 10mg daily", "Metformin 500mg twice daily"],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        patientId: "P002",
        name: "Charlie Brown",
        email: "charlie.brown@email.com",
        phone: "+1-555-0103",
        age: 28,
        gender: "male",
        address: "456 Oak Ave, City, State 12345",
        emergencyContact: {
            name: "Lucy Brown",
            phone: "+1-555-0104",
            relationship: "Sister"
        },
        medicalHistory: ["Asthma"],
        allergies: ["Dairy"],
        medications: ["Albuterol inhaler as needed"],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

demoPatients.forEach(patient => {
    const existingPatient = db.patients.findOne({ patientId: patient.patientId });
    if (!existingPatient) {
        db.patients.insertOne(patient);
        print(`Created demo patient: ${patient.name} (${patient.patientId})`);
    } else {
        print(`Demo patient already exists: ${patient.name} (${patient.patientId})`);
    }
});

// Create system configuration
print('Creating system configuration...');

const systemConfig = {
    _id: "system_config",
    appName: "MediAssist",
    version: "1.0.0",
    features: {
        audioProcessing: true,
        aiNoteGeneration: true,
        translation: true,
        textToSpeech: true,
        analytics: true
    },
    limits: {
        maxFileSize: 52428800, // 50MB
        maxAudioDuration: 3600, // 1 hour
        maxConcurrentUploads: 5
    },
    aiServices: {
        speechToText: "openai/whisper-large-v3",
        naturalLanguageProcessing: "microsoft/DialoGPT-medium",
        translation: "Helsinki-NLP/opus-mt-en-es"
    },
    createdAt: new Date(),
    updatedAt: new Date()
};

const existingConfig = db.system_config.findOne({ _id: "system_config" });
if (!existingConfig) {
    db.system_config.insertOne(systemConfig);
    print('Created system configuration');
} else {
    print('System configuration already exists');
}

print('MediAssist database initialization completed successfully!');
