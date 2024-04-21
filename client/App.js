import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Camera } from 'expo-camera';
import axios from 'axios';
import { DOMEN } from "./Consts";
import * as FileSystem from 'expo-file-system';

export default function App() {
    const [hasPermission, setHasPermission] = useState(null);
    const [type, setType] = useState(Camera.Constants.Type.back);
    const [isLoading, setIsLoading] = useState(false);
    const [cameraRef, setCameraRef] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [streaming, setStreaming] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    const [emotionDetected, setEmotionDetected] = useState('Не обнаружено');

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const startStreaming = async () => {
        setIsLoading(true);
        const id = setInterval(async () => {
            if (cameraRef) {
                let photo = await cameraRef.takePictureAsync({quality: 0.1}); // Увеличиваем качество изображения
                setCapturedImage(photo.uri);
                try {
                    const url = `${DOMEN}api/analyze_camera_photo/`;
                    const formData = new FormData();
                    formData.append('photo', {
                        uri: photo.uri,
                        type: 'image/jpeg',
                        name: 'photo.jpg',
                    });
                    const response = await axios.post(url, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                    const is_emotion = response.data.emotion_detected;
                    console.log('Emotion:', is_emotion);
                    if (is_emotion) {
                        setEmotionDetected('Плачет');
                    } else{
                        setEmotionDetected('Не плачет');
                    }
                } catch (error) {
                    console.error('Error:', error);
                }
            }
        }, 1000); // Отправка данных каждую секунду

        setIntervalId(id);
        setStreaming(true);
        setIsLoading(false);
    };

    const stopStreaming = () => {
        clearInterval(intervalId);
        setStreaming(false);
    };

    if (hasPermission === null) {
        return <View />;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    return (
        <View style={styles.container}>
            <Camera style={[styles.camera, { aspectRatio: 3 / 4 }]} type={type} ref={(ref) => { setCameraRef(ref); }}>
                <View style={styles.buttonContainer}>
                    {!streaming ? (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={startStreaming}
                            disabled={isLoading}
                        >
                            <Text style={styles.text}>Начать стрим</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={stopStreaming}
                            disabled={isLoading}
                        >
                            <Text style={styles.text}>Остановить стрим</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Camera>
            <View style={styles.emotionContainer}>
                <Text style={[styles.emotionText, emotionDetected === 'Плачет' ? styles.greenText : styles.redText]}>
                    Эмоция: {emotionDetected}
                </Text>
            </View>
            {/*{capturedImage && <Image source={{ uri: capturedImage }} style={styles.capturedImage} />}*/}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        position: 'absolute',
        alignItems: 'center',
        width: '100%',
        bottom: 20,
    },
    button: {
        position: 'absolute',
        alignItems: 'center',
        left: 130,
        // width: '100%',
        bottom: 0,
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 100,
    },
    text: {
        alignItems: 'center',
        fontSize: 18,
        color: 'white',
    },
    emotionContainer: {
        position: 'absolute',
        bottom: 80,
        width: '100%',
        alignItems: 'center',
    },
    emotionText: {
        fontSize: 18,
        color: 'white',
    },
    greenText: {
        color: 'green',
    },
    redText: {
        color: 'red',
    },
});