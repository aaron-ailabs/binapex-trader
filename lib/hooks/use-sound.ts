import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type SoundType = 'warning' | 'expiry' | 'success' | 'loss' | 'notification';

const SOUND_PATHS: Record<SoundType, string> = {
  warning: '/sounds/warning.mp3',
  expiry: '/sounds/expiry.mp3',
  success: '/sounds/success.mp3',
  loss: '/sounds/loss.mp3',
  notification: '/sounds/notification.mp3',
};

export const useSound = () => {
  const [enabled, setEnabled] = useState(true);
  const [audioElements, setAudioElements] = useState<Record<SoundType, HTMLAudioElement | null>>({
    warning: null,
    expiry: null,
    success: null,
    loss: null,
    notification: null,
  });

  // Fetch user preference
  useEffect(() => {
    const fetchPreference = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('sound_enabled')
          .eq('id', user.id)
          .single();
        if (data) {
          setEnabled(data.sound_enabled ?? true);
        }
      }
    };
    fetchPreference();
  }, []);

  // Preload sounds
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const elements: any = {};
      Object.entries(SOUND_PATHS).forEach(([key, path]) => {
        const audio = new Audio(path);
        audio.preload = 'auto';
        elements[key] = audio;
      });
      setAudioElements(elements);
    }
  }, []);

  const play = useCallback((type: SoundType) => {
    if (!enabled) return;
    const audio = audioElements[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.error('Audio play failed', e));
    }
  }, [enabled, audioElements]);

  return { play, enabled, setEnabled };
};
