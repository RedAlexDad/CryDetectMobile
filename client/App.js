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

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);


    const takePictureAndDetect = async () => {
        setIsLoading(true);
        if (cameraRef) {
            let photo = await cameraRef.takePictureAsync({ quality: 1 }); // Увеличиваем качество изображения
            setCapturedImage(photo.uri);
            // Получаем размер изображения
            // const { size } = await FileSystem.getInfoAsync(photo.uri);
            // console.log('Image size:', size); // Размер изображения в байта
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
                console.log('Emotion:', response.data.emotion_detected);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    if (hasPermission === null) {
        return <View />;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    return (
        <View style={[styles.container, styles.cameraContainer]}>
            <Camera style={[styles.camera, { aspectRatio: 3 / 4 }]} type={type} ref={(ref) => { setCameraRef(ref); }}>
            </Camera>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={takePictureAndDetect}
                    disabled={isLoading}
                >
                    <Text style={styles.text}>{isLoading ? 'Загрузка...' : 'Сделать фото и определить'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    cameraContainer: {
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        backgroundColor: 'transparent',
        marginBottom: 20, // Добавляем отступ внизу
    },
    button: {
        alignSelf: 'center', // Размещаем кнопку по центру
        alignItems: 'center',
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
    },
    text: {
        fontSize: 18,
        color: 'white',
    },
});
