import "./App.css"
import { useEffect, useRef, useState } from "react"
const { ipcRenderer } = window.require("electron")

function App() {
  const audioRef = useRef(null)
  const [songs, setSongs] = useState([])
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1) // Volumen inicial al máximo
  const [audioDevices, setAudioDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState('')
  const [currentTime, setCurrentTime] = useState(0) // Tiempo actual en segundos
  const [duration, setDuration] = useState(0) // Duración total en segundos
  const [loop, setLoop] = useState(false) // Estado de bucle

  // 1. Carga inicial de canciones
  useEffect(() => {
    const loadSongs = async () => {
      const data = await ipcRenderer.invoke('get-songs')
      setSongs(data)
      if (data.length > 0) {
        setCurrentSong(data[0])
      }
    }
    loadSongs()
  }, [])

  // 2. Cargar dispositivos de audio de salida
  useEffect(() => {
    const loadAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const outputs = devices.filter(device => device.kind === 'audiooutput')
        setAudioDevices(outputs)
        if (outputs.length > 0) {
          setSelectedDevice(outputs[0].deviceId)
        }
      } catch (error) {
        console.error('Error al cargar dispositivos de audio:', error)
      }
    }
    loadAudioDevices()
  }, [])

  // 3. EFECTO CRÍTICO: Detectar cambio de canción
  useEffect(() => {
    if (currentSong && audioRef.current) {
      console.log('Cargando canción:', currentSong.src)
      // Quitar load() para evitar doble carga
      // audioRef.current.load() // Forzar la carga del nuevo archivo src
      
      // Aplicar dispositivo de salida si soportado
      if (selectedDevice && audioRef.current.setSinkId) {
        audioRef.current.setSinkId(selectedDevice).catch(console.error)
      }
      
      // Opcional: Si quieres que suene apenas la selecciones
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Esperando interacción...", e))
      }
    }
  }, [currentSong, selectedDevice]) // Agregamos selectedDevice como depe ndencia

  // 4. Aplicar volumen al audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // 6. Actualizar tiempo manualmente si timeupdate no funciona
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
      }
    }, 100) // Actualizar cada 100ms

    return () => clearInterval(interval)
  }, [isPlaying])

  const playMusic = () => {
    console.log('Intentando reproducir')
    audioRef.current.play().then(() => {
      console.log('Reproduciendo')
      setIsPlaying(true)
    }).catch(e => {
      console.error('Error al reproducir:', e)
    })
  }

  const pauseMusic = () => {
    audioRef.current.pause()
    setIsPlaying(false)
  }

  // Función para manejar el clic en la lista
  const handleSelectSong = (song) => {
    setCurrentSong(song)
    setCurrentTime(0) // Reiniciar el tiempo
  }

  // Función para convertir segundos a formato HH:MM:SS o MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hours > 0) {
      return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
    } else {
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`
    }
  }

  // Función para manejar el cambio de progreso
  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value)
    console.log('Cambiando tiempo a:', newTime)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  return (
    <div className="app-container">
      <h1>🎵 SaraMusic</h1>
      
      <div className="song-list">
        {songs.length > 0 ? (
          songs.map((song, index) => (
            <div key={index} className={`song-item ${currentSong?.title === song.title ? 'active' : ''}`}>
              <button onClick={() => handleSelectSong(song)}>
                {song.title}
              </button>
            </div>
          ))
        ) : (
          <p>Buscando canciones en /public/music...</p>
        )}
      </div>

      {currentSong && (
        <div className="player-controls">
          <h3>Reproduciendo: {currentSong.title}</h3>
          {/* Añadimos onEnded para que sepas cuando termina */}
          <audio 
            ref={audioRef} 
            src={currentSong.src} 
            preload="metadata"
            onEnded={() => {
              if (loop) {
                audioRef.current.currentTime = 0
                audioRef.current.play()
              } else {
                setIsPlaying(false)
              }
            }}
            onError={(e) => console.error('Error en audio:', e)}
            onLoadStart={() => console.log('Iniciando carga de audio')}
            onCanPlay={() => {
              console.log('Audio listo para reproducir')
              setDuration(audioRef.current.duration)
            }}
          />
          <button onClick={playMusic} disabled={isPlaying}>Play</button>
          <button onClick={pauseMusic} disabled={!isPlaying}>Pause</button>
          <button onClick={() => setLoop(!loop)} className={`loop-button ${loop ? 'active' : ''}`}>
            🔁 Bucle
          </button>
          
          {/* Barra de progreso */}
          <div className="progress-control">
            <input 
              type="range" 
              min="0" 
              max={duration || 0} 
              step="0.1" 
              value={currentTime} 
              onChange={handleProgressChange}
              className="progress-bar"
            />
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Control de volumen */}
          <div className="volume-control">
            <label>Volumen: {Math.round(volume * 100)}%</label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))} 
            />
          </div>

          {/* Selector de salida de audio */}
          {audioDevices.length > 0 && (
            <div className="audio-output-control">
              <label>Salida de audio:</label>
              <select 
                value={selectedDevice} 
                onChange={(e) => setSelectedDevice(e.target.value)}
              >
                {audioDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Dispositivo ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App