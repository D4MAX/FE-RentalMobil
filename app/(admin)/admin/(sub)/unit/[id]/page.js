"use client";
import { useParams } from "next/navigation";
import UnitForm from "@/components/UnitForm";

export default function Ubah() { return <UnitForm id={useParams().id} />; }
