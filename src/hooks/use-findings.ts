"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Finding } from "@/lib/types";

export function useFindings() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "findings"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Finding[];
      setFindings(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { findings, loading };
}

export function useFinding(id: string) {
  const [finding, setFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "findings", id), (snapshot) => {
      if (snapshot.exists()) {
        setFinding({ id: snapshot.id, ...snapshot.data() } as Finding);
      } else {
        setFinding(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [id]);

  return { finding, loading };
}

export async function updateFinding(
  id: string,
  data: Partial<Omit<Finding, "id">>
) {
  await updateDoc(doc(db, "findings", id), {
    ...data,
    updatedAt: new Date(),
  });
}
