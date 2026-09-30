import { create } from "zustand";
import { axiosToInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { app, isFirebaseConfigured } from "../Constants/firebase";
import {getAuth, GoogleAuthProvider, signInWithPopup} from 'firebase/auth'


export const useAuthStore = create((set,get) => ({
  authUser: null,
  isSignUPing: false,
  isLogining: false,
  isCheckingAuth: true,
  Error: null,
  isUpdateProfile:false,
  onlineUser:[],
  socket:[],
  
  checkAuth: async () => {
    try {
      const res = await axiosToInstance.get("auth/check");
      const result = res.data;

      if (result.success === true) {
        set({ authUser: result.data });
      }
    } catch (error) {
      set({ isCheckingAuth: false });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSignUPing: true });
    {console.log("in signup page");}
    try {
      const res = await axiosToInstance.post("/auth/sign-up", data);
      const result = res.data;
      // console.log(result);
      if (result.success === true) {
        set({ authUser: result.data });
        toast.success("User successfully signed up!");
      } else {
        toast.error(result.message || "Sign up failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      set({ isSignUPing: false });
    }
  },
  signin: async (data) => {
    set({ isLogining: true });
    try {
      const res = await axiosToInstance.post("/auth/sign-in", data);
      const result = res.data;
      // console.log(result);
      if (result.success === true) {
        set({ authUser: result.data });
        toast.success("User successfully signed in!");
      } else {
        toast.error(result.message || "Sign in failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      set({ isLogining: false });
    }
  },
  logout: async()=>{
    try {
        const res = await axiosToInstance.post("/auth/sign-out");
        const result = res.data;
        if (result.success === true) {
        set({ authUser:null});
        toast.success("User successfully logged out!");
      } 
      else {
        toast.error(result.message || "Logged out failed");
      }
    } catch (error) {
        toast.error(error.response?.data?.message || error.message || "Something went wrong");
    }
  },
  avatarupload: async(data)=>{
    try {
      set({isUpdatingProfile:true});
      const formData = new FormData();
      formData.append("avatar", data);

      const res = await axiosToInstance.post("/auth/upload-avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
      });
      const result = res.data;
       if (result.success === true) {
        set({ authUser:result.data});
        toast.success("Avatar successfully updated!");
      } 
      else {
        toast.error(result.message || "Avatar Update  failed!");
      }
    } catch (error) {
        toast.error(error.response?.data?.message || error.message || "Something went wrong");
    }
    finally{
      set({isUpdatingProfile:false});
    }
  },
  disconnectSocket: ()=>{
    if(get().socket?.connected) get().socket.disconnect();
  },
  setonlineUser : (user)=> set({onlineUser:user}),
   handleGoogle: async () => {
    if (!isFirebaseConfigured) {
      toast.error("Google sign-in is unavailable: VITE_FIREBASE_KEY is not configured");
      return;
    }
    set({ isSignUPing: true });
    try {
      const provider = new GoogleAuthProvider();
      const auth = getAuth(app);
      const result = await signInWithPopup(auth, provider);

      const generateUsername = (fullName) => {
        const name = fullName.toLowerCase().replace(/\s+/g, '');
        const randomNum = Math.floor(Math.random() * 10000);
        return `${name}${randomNum}`;
      };

      const payload = {
        username: generateUsername(result.user.displayName),
        fullName: result.user.displayName,
        email: result.user.email,
        photourl: result.user.photoURL,
      };

      const res = await axiosToInstance.post("/auth/google", payload);
      const data = res.data;

      if (data.success === true) {
        set({ authUser: data.data });
        toast.success("User successfully signed in via Google!");
      } else {
        toast.error(data.message || "Google sign-in failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      set({ isSignUPing: false });
    }
  },
}));

