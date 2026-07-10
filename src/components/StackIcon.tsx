/**
 * StackIcon — Light weight wrapper for rendering developer stack icons from jsDelivr / Devicon CDN.
 * Bypasses compiling giant 8.7MB index.js bundles from tech-stack-icons that crash Vite memory.
 */

import React from "react";

interface StackIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

const iconPaths: Record<string, string> = {
  js: "javascript/javascript-original.svg",
  typescript: "typescript/typescript-original.svg",
  reactjs: "react/react-original.svg",
  nodejs: "nodejs/nodejs-original.svg",
  expressjs: "express/express-original.svg",
  mongodb: "mongodb/mongodb-original.svg",
  postman: "postman/postman-original.svg",
  auth0: "auth0/auth0-original.svg",
  tailwindcss: "tailwindcss/tailwindcss-original.svg",
  css3: "css3/css3-original.svg",
  git: "git/git-original.svg",
  firebase: "firebase/firebase-original.svg",
  docker: "docker/docker-original.svg",
  vercel: "vercel/vercel-original.svg",
  aws: "amazonwebservices/amazonwebservices-original-wordmark.svg",
};

export default function StackIcon({ name, className = "", style }: StackIconProps) {
  const path = iconPaths[name];
  if (!path) return null;

  const url = `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${path}`;

  return (
    <img
      src={url}
      alt={`${name} icon`}
      className={className}
      style={{
        display: "block",
        objectFit: "contain",
        ...style,
      }}
      // Gracefully handle load error by hiding the broken image
      onError={(e) => {
        (e.target as HTMLElement).style.display = "none";
      }}
    />
  );
}
