import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import api from '../../api';
import useAuth from '../../hooks/useAuth';
import ExchangeList from './ExchangeList';
import ChatWindow from './ChatWindow';
import LoadingSpinner from '../common/LoadingSpinner';
import RatingModal from './RatingModal';
import IncomingCallModal from './IncomingCallModal';
import VideoCallUI from './VideoCallUI';

const DashboardPage = () => {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [exchangeToRate, setExchangeToRate] = useState(null);
  const { user, fetchNotifications } = useAuth();

  // --- Video Call State ---
  const [callState, setCallState] = useState({
    incomingCall: null, // { from, exchangeId }
    isCallActive: false,
    callPartner: null,
  });
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const screenTrackRef = useRef(null);

  // --- WebRTC Cleanup ---
  const cleanupCall = useCallback(() => {
    console.log("Cleaning up call resources...");
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallState({ incomingCall: null, isCallActive: false, callPartner: null });
    setIsMicMuted(false);
    setIsCamOff(false);
    if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
    }
  }, [localStream]);


  // --- WebRTC Logic ---
  const createPeerConnection = useCallback((partner) => {
    const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
            socketRef.current.emit('webrtc-ice-candidate', {
                candidate: event.candidate,
                to: partner,
            });
        }
    };

    pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
    };
    
    pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed' || pc.iceConnectionState === 'failed') {
            console.log("ICE connection state changed to:", pc.iceConnectionState);
            cleanupCall();
        }
    };

    return pc;
  }, [cleanupCall]);

  // --- Socket.IO Connection and Listener Setup ---
  useEffect(() => {
    if (!user) return;

    // Establish socket connection
    const socketURL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace('/api', '');
    const socket = io(socketURL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('registerUser', user._id);
    });

    // Define handlers for socket events
    const handleIncomingCall = ({ from, exchangeId }) => {
        if (callState.isCallActive || callState.incomingCall) return;
        setCallState(prev => ({ ...prev, incomingCall: { from, exchangeId } }));
    };

    const handleCallAccepted = async ({ from }) => {
        console.log("Call accepted by", from.name);
        peerConnectionRef.current = createPeerConnection(from);
        localStream.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, localStream));
        
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);

        socket.emit('webrtc-offer', { offer, to: from });
    };

    const handleWebRTCOffer = async (offer) => {
        if (!peerConnectionRef.current || !callState.callPartner) return;
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        
        localStream.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, localStream));

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        socket.emit('webrtc-answer', { answer, to: callState.callPartner });
    };

    const handleWebRTCAnswer = async (answer) => {
        if (!peerConnectionRef.current) return;
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleWebRTCIceCandidate = (candidate) => {
        if (!peerConnectionRef.current) return;
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handleCallDeclined = () => {
        alert("Call declined.");
        cleanupCall();
    };

    const handleCallEnded = () => {
        console.log("Remote user ended the call.");
        cleanupCall();
    };

    // Register listeners
    socket.on('incoming-video-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('webrtc-ice-candidate', handleWebRTCIceCandidate);
    socket.on('call-declined', handleCallDeclined);
    socket.on('call-ended', handleCallEnded);

    // Disconnect and clean up listeners on unmount
    return () => {
        socket.off('incoming-video-call', handleIncomingCall);
        socket.off('call-accepted', handleCallAccepted);
        socket.off('webrtc-offer', handleWebRTCOffer);
        socket.off('webrtc-answer', handleWebRTCAnswer);
        socket.off('webrtc-ice-candidate', handleWebRTCIceCandidate);
        socket.off('call-declined', handleCallDeclined);
        socket.off('call-ended', handleCallEnded);
        socket.disconnect();
    };
  }, [user, callState.isCallActive, callState.incomingCall, callState.callPartner, localStream, cleanupCall, createPeerConnection]);


  // --- Call Handling Functions ---
  const initiateCall = async (partner) => {
    if (!socketRef.current) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setCallState({ incomingCall: null, isCallActive: true, callPartner: partner });

        socketRef.current.emit('video-call-request', {
            from: { _id: user._id, name: user.name, avatar: user.avatar },
            to: partner,
            exchangeId: selectedExchange._id,
        });
    } catch (err) {
        console.error("Failed to get media devices.", err);
        alert("Could not start video call. Please ensure you have given camera and microphone permissions.");
    }
  };

  const acceptCall = async () => {
    if (!callState.incomingCall) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        
        const caller = callState.incomingCall.from;
        setCallState({ incomingCall: null, isCallActive: true, callPartner: caller });

        peerConnectionRef.current = createPeerConnection(caller);

        socketRef.current.emit('video-call-accepted', {
            from: { _id: user._id, name: user.name, avatar: user.avatar },
            to: caller,
        });
    } catch (err) {
        console.error("Failed to get media devices on accept.", err);
        alert("Could not start video call. Please ensure you have given camera and microphone permissions.");
        declineCall();
    }
  };

  const declineCall = () => {
    if (!socketRef.current || !callState.incomingCall) return;
    socketRef.current.emit('video-call-declined', { to: callState.incomingCall.from });
    setCallState(prev => ({ ...prev, incomingCall: null }));
  };

  const endCall = () => {
    if (socketRef.current && callState.callPartner) {
        socketRef.current.emit('end-call', { to: callState.callPartner });
    }
    cleanupCall();
  };
  
  // --- Media Controls ---
  const toggleMic = () => {
    if (localStream) {
        localStream.getAudioTracks().forEach(track => {
            track.enabled = !track.enabled;
        });
        setIsMicMuted(prev => !prev);
    }
  };

  const toggleCam = () => {
    if (localStream) {
        localStream.getVideoTracks().forEach(track => {
            track.enabled = !track.enabled;
        });
        setIsCamOff(prev => !prev);
    }
  };

  const toggleScreenShare = async (isSharing) => {
    if (!peerConnectionRef.current || !localStream) return false;

    const videoTrack = localStream.getVideoTracks()[0];
    const sender = peerConnectionRef.current.getSenders().find(s => s.track.kind === 'video');

    if (isSharing) { // Start sharing
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];
            screenTrackRef.current = screenTrack;
            sender.replaceTrack(screenTrack);
            
            screenTrack.onended = () => {
                sender.replaceTrack(videoTrack);
                setIsCamOff(false);
                screenTrackRef.current = null;
            };
            return true;
        } catch (err) {
            console.error("Screen share failed:", err);
            return false;
        }
    } else { // Stop sharing
        if (screenTrackRef.current) {
            screenTrackRef.current.stop();
            screenTrackRef.current = null;
        }
        sender.replaceTrack(videoTrack);
        return false;
    }
  };


  // --- Data Fetching and Regular App Logic ---
  // *** FIX #1: The dependency array is now just [user]. This stops the main page refresh loop. ***
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/exchanges');
        setExchanges(res.data);
        fetchNotifications();
      } catch (err) {
        setError('Failed to fetch your exchanges. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
        fetchAllData();
    }
  }, [user]);

  const handleSelectExchange = (exchange) => setSelectedExchange(exchange);

  const handleUpdateExchange = (updatedExchange) => {
    setExchanges(prev => prev.map(ex => ex._id === updatedExchange._id ? updatedExchange : ex));
    if (selectedExchange && selectedExchange._id === updatedExchange._id) {
        setSelectedExchange(updatedExchange);
    }
  };
  
  // *** FIX #2: Stabilize `handleMessagesSeen` by removing the unstable `fetchNotifications` from its dependencies. ***
  const handleMessagesSeen = useCallback(() => {
    fetchNotifications();
    api.get('/exchanges')
       .then(res => setExchanges(res.data))
       .catch(err => console.error("Failed to refresh exchanges", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenRatingModal = (exchange) => {
    setExchangeToRate(exchange);
    setIsRatingModalOpen(true);
  };

  const handleCloseRatingModal = (updatedExchange) => {
    if (updatedExchange) handleUpdateExchange(updatedExchange);
    setIsRatingModalOpen(false);
    setExchangeToRate(null);
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  if (error) return <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>;

  return (
    <>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">Your Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ExchangeList 
              exchanges={exchanges} 
              currentUser={user}
              onSelectExchange={handleSelectExchange}
              onUpdateExchange={handleUpdateExchange}
              onRateUser={handleOpenRatingModal}
            />
          </div>
          <div className="bg-white rounded-lg shadow-md p-0 lg:p-0 h-[70vh] flex flex-col overflow-hidden">
            {selectedExchange ? (
              <ChatWindow 
                key={selectedExchange._id}
                exchange={selectedExchange} 
                currentUser={user}
                onClose={() => setSelectedExchange(null)}
                onMessagesSeen={handleMessagesSeen}
                onInitiateCall={initiateCall}
                socket={socketRef.current}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <h3 className="text-xl font-semibold">No Conversation Selected</h3>
                <p>Select an exchange from the list to view messages.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {isRatingModalOpen && (
        <RatingModal exchange={exchangeToRate} currentUser={user} onClose={handleCloseRatingModal} />
      )}
      {/* --- Video Call Modals --- */}
      {callState.incomingCall && (
        <IncomingCallModal 
            caller={callState.incomingCall.from}
            onAccept={acceptCall}
            onDecline={declineCall}
        />
      )}
      {callState.isCallActive && (
        <VideoCallUI 
            localStream={localStream}
            remoteStream={remoteStream}
            onEndCall={endCall}
            onToggleMic={toggleMic}
            onToggleCam={toggleCam}
            onShareScreen={toggleScreenShare}
            isMicMuted={isMicMuted}
            isCamOff={isCamOff}
        />
      )}
    </>
  );
};

export default DashboardPage;
