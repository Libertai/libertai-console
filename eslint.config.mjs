import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat();

const config = [...compat.extends("next/core-web-vitals", "next/typescript", "prettier")];

export default config;
