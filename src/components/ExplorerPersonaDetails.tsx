@@ .. @@
 import { ArrowLeft, Star, StarOff, Eye, MessageSquare, Code, Info, Share2, Check } from 'lucide-react';
 import { Persona } from '../types';
+import { getAvatarUrl } from '../utils/avatarHelpers';
 import { supabase } from '../lib/supabase';
 import { AuthContext } from '../lib/AuthContext';
 import { Chat } from '../components/Chat';
@@ .. @@
               </button>
               <div className="flex items-center gap-2">
                 <img
-                  src={displayPersona.avatar}
+                  src={getAvatarUrl(displayPersona.avatar)}
                   alt={displayPersona.name}
                   className="w-8 h-8 rounded-full object-cover"
                 />