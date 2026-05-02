"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  writeBatch,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Finding } from "@/lib/types";

export function useFindings() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We fetch without a strict 'orderBy(order)' filter initially 
    // because documents without the 'order' field would be hidden by Firestore.
    const q = query(collection(db, "findings"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Finding[];
      
      // Client-side sorting to handle documents missing the 'order' field
      const sorted = [...data].sort((a, b) => {
        const orderA = a.order ?? (a.createdAt?.toMillis?.() || 0);
        const orderB = b.order ?? (b.createdAt?.toMillis?.() || 0);
        return orderB - orderA;
      });

      setFindings(sorted);
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

export async function updateFindingsOrder(updates: { id: string; order: number }[]) {
  const batch = writeBatch(db);
  updates.forEach(({ id, order }) => {
    const docRef = doc(db, "findings", id);
    batch.update(docRef, { order, updatedAt: new Date() });
  });
  await batch.commit();
}

export function useSettings() {
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "general"), (snapshot) => {
      if (snapshot.exists()) {
        setCategoryOrder(snapshot.data().categoryOrder || []);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { categoryOrder, loading };
}

export async function updateCategoryOrder(order: string[]) {
  await setDoc(doc(db, "settings", "general"), { categoryOrder: order }, { merge: true });
}
