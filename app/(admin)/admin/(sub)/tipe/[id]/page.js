"use client";
import { useParams } from "next/navigation";
import TipeForm from "@/components/TipeForm";

export default function Ubah() { return <TipeForm id={useParams().id} />; }
