"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
  writeBatch,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Finding } from "@/lib/types";
import { useSession } from "@/components/auth/session-context";

function getFindingsCollection(inviteCode: string) {
  return collection(db, "sessions", inviteCode, "findings");
}

function getFindingDoc(inviteCode: string, id: string) {
  return doc(db, "sessions", inviteCode, "findings", id);
}

function getSettingsDoc(inviteCode: string) {
  return doc(db, "sessions", inviteCode, "settings", "general");
}

export function useFindings() {
  const { currentSession } = useSession();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentSession) {
      return;
    }

    // We fetch without a strict 'orderBy(order)' filter initially 
    // because documents without the 'order' field would be hidden by Firestore.
    const q = query(getFindingsCollection(currentSession.inviteCode));
    
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
  }, [currentSession]);

  return { findings, loading };
}

export function useFinding(id: string) {
  const { currentSession } = useSession();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentSession) {
      return;
    }

    const unsubscribe = onSnapshot(getFindingDoc(currentSession.inviteCode, id), (snapshot) => {
      if (snapshot.exists()) {
        setFinding({ id: snapshot.id, ...snapshot.data() } as Finding);
      } else {
        setFinding(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [id, currentSession]);

  return { finding, loading };
}

export async function updateFinding(
  inviteCode: string,
  id: string,
  data: Partial<Omit<Finding, "id">>
) {
  await updateDoc(getFindingDoc(inviteCode, id), {
    ...data,
    updatedAt: new Date(),
  });
}

export async function updateFindingsOrder(
  inviteCode: string,
  updates: { id: string; order: number }[]
) {
  const batch = writeBatch(db);
  updates.forEach(({ id, order }) => {
    const docRef = getFindingDoc(inviteCode, id);
    batch.update(docRef, { order, updatedAt: new Date() });
  });
  await batch.commit();
}

async function commitFindingUpdates(
  inviteCode: string,
  updates: { id: string; data: Partial<Omit<Finding, "id">> }[]
) {
  const batchSize = 450;

  for (let index = 0; index < updates.length; index += batchSize) {
    const batch = writeBatch(db);

    for (const update of updates.slice(index, index + batchSize)) {
      batch.update(getFindingDoc(inviteCode, update.id), {
        ...update.data,
        updatedAt: new Date(),
      });
    }

    await batch.commit();
  }
}

function renameCategoryInOrder(order: string[], from: string, to: string) {
  const nextOrder: string[] = [];

  for (const category of order) {
    const nextCategory = category === from ? to : category;

    if (!nextOrder.includes(nextCategory)) {
      nextOrder.push(nextCategory);
    }
  }

  return nextOrder;
}

export async function deleteTagFromFindings(
  inviteCode: string,
  findings: Finding[],
  tag: string
) {
  const affectedFindings = findings.filter(
    (finding) => Array.isArray(finding.tags) && finding.tags.includes(tag)
  );

  await commitFindingUpdates(
    inviteCode,
    affectedFindings.map((finding) => ({
      id: finding.id,
      data: {
        tags: finding.tags.filter((findingTag) => findingTag !== tag),
      },
    }))
  );

  return affectedFindings.length;
}

export async function renameCategoryInFindings(
  inviteCode: string,
  findings: Finding[],
  categoryOrder: string[],
  from: string,
  to: string
) {
  const previousCategory = from.trim();
  const nextCategory = to.trim();

  if (!previousCategory || !nextCategory || previousCategory === nextCategory) {
    return 0;
  }

  const affectedFindings = findings.filter(
    (finding) => finding.category === previousCategory
  );

  await commitFindingUpdates(
    inviteCode,
    affectedFindings.map((finding) => ({
      id: finding.id,
      data: { category: nextCategory },
    }))
  );

  if (categoryOrder.includes(previousCategory)) {
    await setDoc(
      getSettingsDoc(inviteCode),
      {
        categoryOrder: renameCategoryInOrder(
          categoryOrder,
          previousCategory,
          nextCategory
        ),
      },
      { merge: true }
    );
  }

  return affectedFindings.length;
}

export function useSettings() {
  const { currentSession } = useSession();
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentSession) {
      return;
    }

    const unsubscribe = onSnapshot(getSettingsDoc(currentSession.inviteCode), (snapshot) => {
      if (snapshot.exists()) {
        setCategoryOrder(snapshot.data().categoryOrder || []);
      } else {
        setCategoryOrder([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [currentSession]);

  return { categoryOrder, loading };
}

export async function updateCategoryOrder(inviteCode: string, order: string[]) {
  await setDoc(getSettingsDoc(inviteCode), { categoryOrder: order }, { merge: true });
}
