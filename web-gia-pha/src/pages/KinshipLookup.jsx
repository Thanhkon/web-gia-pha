import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Users, ArrowRight, UserCheck } from 'lucide-react';
import SearchableSelect from '../components/common/SearchableSelect';
import { computeKinship } from '../utils/kinshipHelpers';

import { useParams } from 'react-router-dom';
import { fetchFamilyTree } from '../store/slices/membersSlice';

import '../css/pages/KinshipLookup.css';

const KinshipLookup = () => {
  const { familyId } = useParams();
  const dispatch = useDispatch();
  
  const persons = useSelector((state) => state.members.persons);
  const relationships = useSelector((state) => state.members.relationships);
  const { status } = useSelector((state) => state.members);

  useEffect(() => {
    if (familyId) {
      dispatch(fetchFamilyTree(familyId));
    }
  }, [dispatch, familyId]);

  const [personAId, setPersonAId] = useState('');
  const [personBId, setPersonBId] = useState('');
  const [result, setResult] = useState(null);

  const activePersons = useMemo(() => persons.filter(p => !p.isDeleted), [persons]);

  const personOptions = useMemo(() => {
    return activePersons.map(p => ({
      value: p.id,
      label: `${p.fullName} (Đời ${p.generation})`,
    }));
  }, [activePersons]);

  const handleLookup = () => {
    if (!personAId || !personBId) return;

    const pMap = new Map();
    activePersons.forEach(p => pMap.set(p.id, p));

    const personA = pMap.get(personAId);
    const personB = pMap.get(personBId);

    if (!personA || !personB) return;

    const kinship = computeKinship(personA, personB, activePersons, relationships);
    setResult({
      personA,
      personB,
      ...kinship
    });
  };

  return (
    <div className="kinship-lookup-page container animate-fade-in">
      <div className="kinship-lookup-widget">
        <div className="kinship-widget-header">
          <Users size={24} className="kinship-widget-icon" />
          <h2 className="kinship-widget-title">Tra cứu danh xưng</h2>
        </div>

        <div className="kinship-widget-body">
          <div className="kinship-inputs-row">
            <div className="kinship-input-group">
              <label>Người hỏi (Xưng là)</label>
              <SearchableSelect
                options={personOptions}
                value={personAId}
                onChange={(val) => { setPersonAId(val); setResult(null); }}
                placeholder="Chọn người hỏi..."
              />
            </div>

            <div className="kinship-arrow-indicator">
              <ArrowRight size={20} className="arrow-icon" />
            </div>

            <div className="kinship-input-group">
              <label>Người đối diện (Gọi là)</label>
              <SearchableSelect
                options={personOptions}
                value={personBId}
                onChange={(val) => { setPersonBId(val); setResult(null); }}
                placeholder="Chọn người đối diện..."
              />
            </div>

            <button
              className="btn btn-primary kinship-lookup-btn"
              onClick={handleLookup}
              disabled={!personAId || !personBId || personAId === personBId}
            >
              <UserCheck size={18} /> Tra cứu
            </button>
          </div>

          {result && (
            <div className="kinship-result-box animate-fade-in">
              <div className="kinship-result-main">
                <div className="kinship-person-card">
                  <span className="person-role">Người hỏi</span>
                  <span className="person-name">{result.personA.fullName}</span>
                  <span className="person-call">Xưng là: <strong>{result.bCallsA}</strong></span>
                </div>

                <div className="kinship-exchange-icon">
                  <ArrowRight size={24} />
                </div>

                <div className="kinship-person-card">
                  <span className="person-role">Người đối diện</span>
                  <span className="person-name">{result.personB.fullName}</span>
                  <span className="person-call">Gọi là: <strong>{result.aCallsB}</strong></span>
                </div>
              </div>

              {result.description && (
                <div className="kinship-description">
                  <p><strong>Giải thích:</strong> {result.description}</p>
                  {result.pathLabels && result.pathLabels.length > 0 && (
                    <p className="kinship-path">
                      <strong>Đường đi:</strong> {result.pathLabels.join(" ➔ ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KinshipLookup;
