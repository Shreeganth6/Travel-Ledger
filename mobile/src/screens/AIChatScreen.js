import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, SIZES, FONTS } from '../constants/theme';
import axios from '../api/axios';

const AIChatScreen = () => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm your AI Financial Advisor. Ask me anything about your trips or expenses.",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef();

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => { flatListRef.current.scrollToEnd({ animated: true }); }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userMsg = { id: Date.now().toString(), text: inputText.trim(), sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    // Keyboard.dismiss(); // Keep keyboard open for chat experience

    try {
      const response = await axios.post('/ai/chat', { message: userMsg.text });
      if (response.data.success) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: response.data.message, sender: 'ai', timestamp: new Date() }]);
      } else { throw new Error(response.data.message || 'Unknown error'); }
    } catch (error) {
      const serverMsg = error.response?.data?.message;
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: serverMsg ? `⚠️ Error: ${serverMsg}` : "Sorry, I couldn't process that request right now.",
        sender: 'ai', isError: true, timestamp: new Date(),
      }]);
    } finally { setIsLoading(false); }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMsgContainer : styles.aiMsgContainer]}>
        {!isUser && (
          <LinearGradient
            colors={COLORS.gradientPrimary}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.aiAvatar}
          >
            <Ionicons name="sparkles" size={14} color={COLORS.white} />
          </LinearGradient>
        )}
        <View style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
          item.isError && styles.errorBubble,
        ]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
      <View style={styles.bgOrb} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={COLORS.gradientPrimary}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.headerIcon}
          >
            <Ionicons name="sparkles" size={20} color={COLORS.white} />
          </LinearGradient>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>AI Advisor</Text>
            <Text style={styles.headerSub}>Powered by AI</Text>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isLoading && (
          <View style={styles.loadingRow}>
            <View style={styles.loadingDot} />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}

        {/* Input */}
        <View style={[
          styles.inputContainer,
          isKeyboardVisible && { paddingBottom: SPACING.md, borderTopColor: 'rgba(255,255,255,0.1)' }
        ]}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Ask about your trips..."
              placeholderTextColor={COLORS.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <LinearGradient
              colors={inputText.trim() ? COLORS.gradientPrimary : ['rgba(99,102,241,0.3)', 'rgba(168,85,247,0.3)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.sendGradient}
            >
              <Ionicons name="send" size={18} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bgOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(168,85,247,0.06)', top: 200, left: -100 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: SIZES.paddingLarge,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, ...SHADOWS.colored },
  headerCenter: {},
  headerTitle: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight },
  headerSub: { fontSize: SIZES.tiny, fontFamily: FONTS.regular, color: COLORS.primaryLight, marginTop: 2 },

  chatList: { padding: SPACING.md, paddingBottom: 160 },
  messageContainer: { flexDirection: 'row', marginBottom: SPACING.md, maxWidth: '85%' },
  userMsgContainer: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  aiMsgContainer: { alignSelf: 'flex-start' },
  aiAvatar: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 4 },
  bubble: { padding: 14, borderRadius: 18, ...SHADOWS.small },
  userBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: COLORS.glassMedium, borderWidth: 1, borderColor: COLORS.glassBorder, borderBottomLeftRadius: 4 },
  errorBubble: { backgroundColor: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.3)' },
  messageText: { fontSize: SIZES.body, fontFamily: FONTS.regular, lineHeight: 22 },
  userText: { color: COLORS.white },
  aiText: { color: COLORS.textPrimary },

  loadingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md },
  loadingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginRight: 8, ...SHADOWS.glow },
  loadingText: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: COLORS.textSecondary, fontStyle: 'italic' },

  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: SPACING.md, paddingBottom: Platform.OS === 'ios' ? 110 : 100,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  inputWrap: {
    flex: 1, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: 20, paddingHorizontal: 16, minHeight: 44, maxHeight: 120, justifyContent: 'center',
  },
  input: { fontSize: SIZES.body, fontFamily: FONTS.regular, color: COLORS.textPrimary, paddingVertical: 10 },
  sendBtn: { marginLeft: 10 },
  sendBtnDisabled: { opacity: 0.5 },
  sendGradient: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});

export default AIChatScreen;
