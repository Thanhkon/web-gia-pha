/**
 * Hệ chuyên gia (Rule Engine) tính toán quan hệ họ hàng (Kinship)
 * Refactored: Sử dụng Dictionary và Pattern Matching để dễ bảo trì và mở rộng.
 */

// ── Từ điển Hằng số ──────────────────────────────────────────────────────────

const ANCESTORS = ["", "Bố/Mẹ", "Ông/Bà", "Cụ", "Kỵ", "Sơ", "Tiệm", "Tiểu", "Di", "Diễn"];
const DESCENDANTS = ["", "Con", "Cháu", "Chắt", "Chít", "Chút", "Chét", "Chót", "Chẹt"];

// ── Hàm Tiện Ích Đồ Thị (Graph Utilities) ───────────────────────────────────

function getSeniority(a, b) {
  if (!a || !b || a.id === b.id) return "equal";
  if (a.birthOrder != null && b.birthOrder != null) {
    return a.birthOrder < b.birthOrder ? "senior" : a.birthOrder > b.birthOrder ? "junior" : "equal";
  }
  if (a.birthYear != null && b.birthYear != null) {
    return a.birthYear < b.birthYear ? "senior" : a.birthYear > b.birthYear ? "junior" : "equal";
  }
  return "equal";
}

function getAncestryData(id, parentMap, personsMap) {
  const depths = new Map();
  const queue = [{ id, depth: 0, path: [] }];

  while (queue.length > 0) {
    const { id: currentId, depth, path } = queue.shift();
    if (!depths.has(currentId)) {
      depths.set(currentId, { depth, path });
      const currentNode = personsMap.get(currentId);
      if (!currentNode) continue;

      const parents = parentMap.get(currentId) || [];
      for (const pId of parents) {
        if (personsMap.has(pId)) {
          queue.push({ id: pId, depth: depth + 1, path: [...path, currentNode] });
        }
      }
    }
  }
  return depths;
}

// ── Tập Luật Huyết Thống (Blood Rules Engine) ────────────────────────────────

function getAncestorTerm(depth, gender, isPaternal) {
  if (depth === 1) return gender === "female" ? "Mẹ" : "Bố";
  if (depth === 2) return (gender === "female" ? "Bà " : "Ông ") + (isPaternal ? "nội" : "ngoại");
  if (depth === 3) return (gender === "female" ? "Cụ bà" : "Cụ ông") + (isPaternal ? " nội" : " ngoại");
  return ANCESTORS[depth] || `Tổ đời ${depth}`;
}

function getDescendantTerm(depth) {
  return DESCENDANTS[depth] || `Cháu đời ${depth}`;
}

/**
 * Đánh giá quan hệ huyết thống dựa vào Tọa độ Đồ thị
 */
function evaluateBloodRule(depthA, depthB, personA, personB, branchA, branchB) {
  const genderA = personA.gender;
  const genderB = personB.gender;

  // 1. Trực hệ (A là hậu duệ của B hoặc ngược lại)
  if (depthA === 0 || depthB === 0) {
    const isA_Ancestor = depthA === 0;
    const depth = isA_Ancestor ? depthB : depthA;
    const ancestor = isA_Ancestor ? personA : personB;
    const descendantBranch = isA_Ancestor ? branchB : branchA;
    const isPaternal = descendantBranch ? descendantBranch.gender === "male" : true;

    const termAncestor = getAncestorTerm(depth, ancestor.gender, isPaternal);
    const termDescendant = getDescendantTerm(depth);

    return {
      aCallsB: isA_Ancestor ? termDescendant : termAncestor,
      bCallsA: isA_Ancestor ? termAncestor : termDescendant,
      desc: "Quan hệ Trực hệ",
    };
  }

  // 2. Ngang hàng hoặc Lệch thế hệ
  if (!branchA || !branchB) return { aCallsB: "Họ hàng", bCallsA: "Họ hàng", desc: "Quan hệ họ hàng" };
  const seniority = getSeniority(branchA, branchB);
  
  const evaluate = (dA, dB, gA, gB, isPaternalSide, sen) => {
    // Anh chị em ruột
    if (dA === 1 && dB === 1) {
      const isSenior = sen === "senior";
      return {
        aCallsB: isSenior ? (gB === "female" ? "Em gái" : "Em trai") : (gB === "female" ? "Chị gái" : "Anh trai"),
        bCallsA: isSenior ? (gA === "female" ? "Chị gái" : "Anh trai") : (gA === "female" ? "Em gái" : "Em trai"),
        desc: "Anh chị em ruột",
      };
    }
    // Cô Dì Chú Bác (B là vai trên)
    if (dA > 1 && dB === 1) {
      let termB = "";
      if (isPaternalSide) {
        termB = gB === "female" ? (sen === "junior" ? "Bác" : "Cô") : (sen === "junior" ? "Bác" : "Chú");
      } else {
        termB = gB === "female" ? "Dì" : "Cậu";
      }
      let prefix = "";
      if (dA === 3) prefix = gB === "female" ? "Bà " : "Ông ";
      else if (dA === 4) prefix = gB === "female" ? "Cụ bà " : "Cụ ông ";
      else if (dA > 4) prefix = ANCESTORS[dA - 1] + " ";

      return {
        aCallsB: (prefix + termB).trim(),
        bCallsA: getDescendantTerm(dA),
        desc: isPaternalSide ? "Bên Nội (Vế trên)" : "Bên Ngoại (Vế trên)",
      };
    }
    // Anh em họ
    if (dA > 1 && dB > 1 && dA === dB) {
      const isSenior = sen === "senior";
      return {
        aCallsB: isSenior ? "Em họ" : (gB === "female" ? "Chị họ" : "Anh họ"),
        bCallsA: isSenior ? (gA === "female" ? "Chị họ" : "Anh họ") : "Em họ",
        desc: `Anh em họ ${isPaternalSide ? "Nội" : "Ngoại"}`,
      };
    }
    // Lệch thế hệ (Họ hàng)
    if (dA > 1 && dB > 1 && dA > dB) {
      let termB = "Họ hàng";
      if (dA - dB === 1) {
        if (isPaternalSide) termB = gB === "female" ? (sen === "junior" ? "Bác họ" : "Cô họ") : (sen === "junior" ? "Bác họ" : "Chú họ");
        else termB = gB === "female" ? "Dì họ" : "Cậu họ";
      } else {
        termB = gB === "female" ? "Bà họ" : "Ông họ";
      }
      return {
        aCallsB: termB,
        bCallsA: "Cháu họ",
        desc: `Họ hàng ${isPaternalSide ? "Nội" : "Ngoại"}`,
      };
    }
    return null;
  };

  // Tính thuận
  let res = evaluate(depthA, depthB, genderA, genderB, branchA.gender === "male", seniority);
  if (res) return res;

  // Tính ngược (Nếu A là vai trên)
  const reverseSen = seniority === "senior" ? "junior" : seniority === "junior" ? "senior" : "equal";
  res = evaluate(depthB, depthA, genderB, genderA, branchB.gender === "male", reverseSen);
  if (res) {
    return { aCallsB: res.bCallsA, bCallsA: res.aCallsB, desc: res.desc.replace("(Vế trên)", "(Vế dưới)") };
  }

  return { aCallsB: "Người trong họ", bCallsA: "Người trong họ", desc: "Quan hệ họ hàng" };
}

function findBloodKinship(personA, personB, personsMap, parentMap) {
  const ancA = getAncestryData(personA.id, parentMap, personsMap);
  const ancB = getAncestryData(personB.id, parentMap, personsMap);

  let lcaId = null;
  let minDistance = Infinity;

  for (const [id, dataA] of ancA) {
    if (ancB.has(id)) {
      const dist = dataA.depth + ancB.get(id).depth;
      if (dist < minDistance) {
        minDistance = dist;
        lcaId = id;
      }
    }
  }

  if (!lcaId) return null;

  const dataA = ancA.get(lcaId);
  const dataB = ancB.get(lcaId);

  const { aCallsB, bCallsA, desc } = evaluateBloodRule(
    dataA.depth, dataB.depth, personA, personB,
    dataA.path[dataA.path.length - 1], dataB.path[dataB.path.length - 1]
  );

  const lcaName = personsMap.get(lcaId)?.fullName || "Tổ tiên chung";
  const pathLabels = [];
  if (personA.id !== lcaId) pathLabels.push(`${personA.fullName} cách ${lcaName} ${dataA.depth} đời.`);
  if (personB.id !== lcaId) pathLabels.push(`${personB.fullName} cách ${lcaName} ${dataB.depth} đời.`);

  return {
    aCallsB,
    bCallsA,
    description: `${desc} (Tổ tiên: ${lcaName})`,
    distance: minDistance,
    pathLabels,
  };
}

// ── Bộ Lọc Hôn Nhân (Marriage Modifiers Pipeline) ──────────────────────────

/** Biến đổi: Tôi gọi gia đình của vợ/chồng tôi là gì */
function transformMySpouseKin(term, myGender) {
  const suffix = myGender === 'male' ? ' vợ' : ' chồng';
  if (/^(Bố|Mẹ|Ông|Bà|Cụ|Kỵ)/.test(term)) return term + suffix;
  if (term.includes('Anh trai')) return 'Anh' + suffix;
  if (term.includes('Chị gái')) return 'Chị' + suffix;
  if (term === 'Em họ') return `Em${suffix} (họ)`;
  if (term === 'Chị họ') return `Chị${suffix} (họ)`;
  if (term === 'Anh họ') return `Anh${suffix} (họ)`;
  if (term.includes('Em')) return 'Em' + suffix;
  if (['Bác', 'Chú', 'Cô', 'Cậu', 'Dì'].includes(term)) return term + suffix;
  if (term.endsWith(' họ')) return term.replace(' họ', '') + suffix;
  return term;
}

/** Biến đổi: Tôi gọi vợ/chồng của gia đình tôi là gì */
function transformKinSpouse(termBloodKin, targetGender) {
  const isFemale = targetGender === 'female';
  if (termBloodKin === 'Con') return isFemale ? 'Con dâu' : 'Con rể';
  if (termBloodKin === 'Cháu') return isFemale ? 'Cháu dâu' : 'Cháu rể';
  if (termBloodKin.includes('Anh trai')) return isFemale ? 'Chị dâu' : 'Anh rể'; // Anh rể của tôi (khi tôi là em gái/trai) - Oh wait, Vợ của anh trai là Chị dâu
  if (termBloodKin.includes('Chị gái')) return isFemale ? 'Chị dâu' : 'Anh rể';
  if (termBloodKin.includes('Chị họ')) return 'Anh rể (họ)';
  if (termBloodKin.includes('Anh họ')) return 'Chị dâu (họ)';
  if (termBloodKin.includes('Em')) return isFemale ? 'Em dâu' : 'Em rể';
  if (termBloodKin === 'Chú') return 'Thím';
  if (termBloodKin === 'Chú họ') return 'Thím họ';
  if (termBloodKin === 'Cậu') return 'Mợ';
  if (termBloodKin === 'Cậu họ') return 'Mợ họ';
  if (termBloodKin === 'Bác') return isFemale ? 'Bác gái' : 'Bác trai';
  if (termBloodKin === 'Bác họ') return isFemale ? 'Bác gái (họ)' : 'Bác trai (họ)';
  if (termBloodKin === 'Cô' || termBloodKin === 'Dì') return 'Dượng';
  if (termBloodKin === 'Cô họ' || termBloodKin === 'Dì họ') return 'Dượng (họ)';
  return `${isFemale ? 'Vợ' : 'Chồng'} của ${termBloodKin}`;
}

// ── Hàm Chính (Main Entry Point) ─────────────────────────────────────────────

export function computeKinship(personA, personB, persons, relationships) {
  if (!personA || !personB || personA.id === personB.id) return null;

  const personsMap = new Map(persons.map(p => [p.id, p]));
  const parentMap = new Map();
  const spouseMap = new Map();

  for (const r of relationships) {
    if (r.type === "biological_child" || r.type === "adopted_child") {
      const p = parentMap.get(r.person_b) || [];
      p.push(r.person_a);
      parentMap.set(r.person_b, p);
    } else if (r.type === "marriage") {
      const sA = spouseMap.get(r.person_a) || [];
      sA.push(r.person_b);
      spouseMap.set(r.person_a, sA);
      const sB = spouseMap.get(r.person_b) || [];
      sB.push(r.person_a);
      spouseMap.set(r.person_b, sB);
    }
  }

  const spousesA = spouseMap.get(personA.id) || [];
  const spousesB = spouseMap.get(personB.id) || [];

  // 1. Trực tiếp Hôn nhân
  if (spousesA.includes(personB.id)) {
    return {
      aCallsB: personB.gender === "female" ? "Vợ" : "Chồng",
      bCallsA: personA.gender === "female" ? "Vợ" : "Chồng",
      description: "Quan hệ Hôn nhân",
      distance: 0,
      pathLabels: [`${personA.fullName} và ${personB.fullName} là vợ chồng.`],
    };
  }

  // 2. Huyết thống
  const blood = findBloodKinship(personA, personB, personsMap, parentMap);
  if (blood) return blood;

  // 3. Qua hôn nhân của A (A gọi họ hàng của Vợ/Chồng A)
  for (const sId of spousesA) {
    if (sId === personB.id) continue;
    const spouseA = personsMap.get(sId);
    if (!spouseA) continue;
    
    const res = findBloodKinship(spouseA, personB, personsMap, parentMap);
    if (res) {
      return {
        ...res,
        aCallsB: transformMySpouseKin(res.aCallsB, personA.gender),
        bCallsA: transformKinSpouse(res.bCallsA, personA.gender),
        description: `Thông qua hôn nhân của ${spouseA.fullName}`,
        pathLabels: [`${personA.fullName} là ${personA.gender === "male" ? "Chồng" : "Vợ"} của ${spouseA.fullName}`, ...res.pathLabels],
      };
    }
  }

  // 4. Qua hôn nhân của B (A gọi Vợ/Chồng của họ hàng A)
  for (const sId of spousesB) {
    const spouseB = personsMap.get(sId);
    if (!spouseB) continue;
    
    const res = findBloodKinship(personA, spouseB, personsMap, parentMap);
    if (res) {
      return {
        ...res,
        aCallsB: transformKinSpouse(res.aCallsB, personB.gender),
        bCallsA: transformMySpouseKin(res.bCallsA, personB.gender),
        description: `Thông qua hôn nhân của ${spouseB.fullName}`,
        pathLabels: [...res.pathLabels, `${personB.fullName} là ${personB.gender === "male" ? "Chồng" : "Vợ"} của ${spouseB.fullName}`],
      };
    }
  }

  // 5. Qua hôn nhân của cả A và B (Ví dụ: Anh em cột chèo, chị em dâu)
  for (const sIdA of spousesA) {
    const spouseA = personsMap.get(sIdA);
    if (!spouseA) continue;
    for (const sIdB of spousesB) {
      if (sIdA === sIdB) continue;
      const spouseB = personsMap.get(sIdB);
      if (!spouseB) continue;

      const res = findBloodKinship(spouseA, spouseB, personsMap, parentMap);
      if (res) {
        let aCallsB = `${personB.gender === 'male' ? 'Chồng' : 'Vợ'} của ${res.aCallsB}`;
        let bCallsA = `${personA.gender === 'male' ? 'Chồng' : 'Vợ'} của ${res.bCallsA}`;

        if (res.description.includes("Anh chị em ruột")) {
          if (personA.gender === 'male' && personB.gender === 'male' && spouseA.gender === 'female' && spouseB.gender === 'female') {
            aCallsB = bCallsA = "Anh em cột chèo";
          } else if (personA.gender === 'female' && personB.gender === 'female' && spouseA.gender === 'male' && spouseB.gender === 'male') {
            aCallsB = bCallsA = "Chị em dâu";
          }
        }

        return {
          ...res, aCallsB, bCallsA,
          description: `Thông qua hôn nhân của cả ${spouseA.fullName} và ${spouseB.fullName}`,
          pathLabels: [
            `${personA.fullName} là ${personA.gender === "male" ? "Chồng" : "Vợ"} của ${spouseA.fullName}`,
            ...res.pathLabels,
            `${personB.fullName} là ${personB.gender === "male" ? "Chồng" : "Vợ"} của ${spouseB.fullName}`,
          ],
        };
      }
    }
  }

  return {
    aCallsB: "Chưa xác định", bCallsA: "Chưa xác định",
    description: "Không tìm thấy quan hệ trong phạm vi dữ liệu",
    distance: -1, pathLabels: [],
  };
}
