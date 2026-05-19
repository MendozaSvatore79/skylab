"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

const EMOTIONS = ["😀", "😎", "🤓", "🥳", "😍", "🤖", "😴", "😇", "😺", "🤠"];
const FRAME_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
];

function svgToDataUrl(svg: string) {
  const base64Svg = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64Svg}`;
}

function createEmotionAvatarDataUrl(emoji: string, frameColor: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="95" fill="#FFFFFF" stroke="${frameColor}" stroke-width="10" />
    <circle cx="100" cy="100" r="80" fill="#F3F4F6" />
    <text x="100" y="122" text-anchor="middle" font-size="84" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji">${emoji}</text>
  </svg>`;
  return svgToDataUrl(svg);
}

function createInitialsAvatarDataUrl(initials: string, frameColor: string) {
  const safeInitials = initials || "US";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="95" fill="#FFFFFF" stroke="${frameColor}" stroke-width="10" />
    <circle cx="100" cy="100" r="80" fill="#E0E7FF" />
    <text x="100" y="118" text-anchor="middle" font-size="62" font-weight="700" fill="#1F2937" font-family="Inter, Arial, sans-serif">${safeInitials}</text>
  </svg>`;
  return svgToDataUrl(svg);
}

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user, fetchUser } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState<string>("/images/user/owner.jpg");
  const [selectedFrameColor, setSelectedFrameColor] = useState<string>(FRAME_COLORS[0]);
  const [selectedType, setSelectedType] = useState<"emotion" | "initials" | "custom">("custom");
  const [selectedEmotion, setSelectedEmotion] = useState<string>(EMOTIONS[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.avatar_url) {
      setSelectedAvatar(user.avatar_url);
    }
  }, [user]);

  const displayName = useMemo(() => {
    const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
    if (fullName) return fullName;
    return user?.email?.split("@")[0] || "Usuario";
  }, [user]);

  const userInitials = useMemo(() => {
    const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
    if (!fullName) {
      const fallback = user?.email?.split("@")[0] || "US";
      return fallback.slice(0, 2).toUpperCase();
    }
    const parts = fullName.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [user]);

  const emotionAvatars = useMemo(() => {
    return EMOTIONS.map((emoji) => ({
      emoji,
      url: createEmotionAvatarDataUrl(emoji, selectedFrameColor),
    }));
  }, [selectedFrameColor]);

  const initialsAvatar = useMemo(() => {
    return createInitialsAvatarDataUrl(userInitials, selectedFrameColor);
  }, [userInitials, selectedFrameColor]);

  useEffect(() => {
    if (selectedType === "emotion") {
      setSelectedAvatar(createEmotionAvatarDataUrl(selectedEmotion, selectedFrameColor));
    }
    if (selectedType === "initials") {
      setSelectedAvatar(initialsAvatar);
    }
  }, [selectedType, selectedEmotion, selectedFrameColor, initialsAvatar]);

  const handleSaveAvatar = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          selectedAvatar.startsWith("data:image/")
            ? { avatarBase64: selectedAvatar }
            : { avatarUrl: selectedAvatar }
        ),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "No se pudo guardar el avatar");
      }

      const data = await res.json();
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        await fetchUser();
      }

      closeModal();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error al guardar avatar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <Image width={80} height={80} src={selectedAvatar || "/images/user/owner.jpg"} alt={displayName} />
            </div>

            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {displayName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || "Sin correo"}</p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.address || "Sin dirección"}</p>
              </div>
            </div>

            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              <Button size="sm" onClick={openModal}>Cambiar avatar</Button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[760px] m-4">
        <div className="relative w-full max-w-[760px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Elige tu avatar</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Selecciona uno de los avatares y guarda cambios.</p>

          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Color del marco</p>
            <div className="flex flex-wrap gap-2">
              {FRAME_COLORS.map((color) => {
                const active = selectedFrameColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedFrameColor(color)}
                    className={`h-8 w-8 rounded-full border-2 ${active ? "border-gray-900 dark:border-white" : "border-gray-300 dark:border-gray-600"}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Color ${color}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="mb-6 p-4 border rounded-xl border-gray-200 dark:border-gray-700">
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Avatar con iniciales</p>
            <button
              type="button"
              onClick={() => {
                setSelectedType("initials");
                setSelectedAvatar(initialsAvatar);
              }}
              className={`rounded-full p-0.5 transition ${selectedType === "initials" ? "ring-2 ring-brand-500" : "ring-1 ring-gray-200 dark:ring-gray-700"}`}
            >
              <Image src={initialsAvatar} alt="Avatar iniciales" width={56} height={56} className="h-14 w-14 rounded-full object-cover" unoptimized />
            </button>
          </div>

          <div className="mb-6 p-4 border rounded-xl border-gray-200 dark:border-gray-700">
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Caras con emociones</p>
            <div className="grid grid-cols-5 gap-3 sm:grid-cols-7 lg:grid-cols-10">
              {emotionAvatars.map((item) => {
                const isActive = selectedType === "emotion" && selectedEmotion === item.emoji;
                return (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => {
                      setSelectedType("emotion");
                      setSelectedEmotion(item.emoji);
                      setSelectedAvatar(item.url);
                    }}
                    className={`rounded-full p-0.5 transition ${isActive ? "ring-2 ring-brand-500" : "ring-1 ring-gray-200 dark:ring-gray-700"}`}
                  >
                    <Image src={item.url} alt={`Avatar ${item.emoji}`} width={56} height={56} className="h-14 w-14 rounded-full object-cover" unoptimized />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8">
            <Button size="sm" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button size="sm" onClick={handleSaveAvatar} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar avatar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
