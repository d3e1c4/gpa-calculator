import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Calculator, Target, Plus, Trash2, GraduationCap, RotateCcw, Download } from 'lucide-react';

const gradePoints = {
  'A+': 4.00, 'A': 4.00, 'A-': 3.70,
  'B+': 3.30, 'B': 3.00, 'B-': 2.70,
  'C+': 2.30, 'C': 2.00, 'C-': 1.70,
  'D+': 1.30, 'D': 1.00, 'E': 0.00
};

const STORAGE_KEY_COURSES = 'gpa_calc_courses';
const STORAGE_KEY_TARGETS = 'gpa_calc_targets';
const STORAGE_KEY_TAB = 'gpa_calc_tab';

const DEFAULT_COURSES = [
  { id: 1, name: 'Module 1', credits: 3, grade: 'A' },
  { id: 2, name: 'Module 2', credits: 3, grade: 'B+' },
  { id: 3, name: 'Module 3', credits: 2, grade: 'A-' }
];

const DEFAULT_TARGETS = {
  y2s1: 3.33, y2s2: 3.75,
  y3s1: 3.75, y3s2: 3.75,
  y4s1: 3.75, y4s2: 3.75
};

/* Safe localStorage helpers */
function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded etc. — silently ignore */ }
}

/* Degree class helper */
function getDegreeClass(gpa) {
  const val = parseFloat(gpa);
  if (val >= 3.70) return { label: 'First Class', key: 'first' };
  if (val >= 3.30) return { label: 'Second Class Upper', key: 'second-upper' };
  if (val >= 2.70) return { label: 'Second Class Lower', key: 'second-lower' };
  if (val >= 2.00) return { label: 'General Pass', key: 'pass' };
  return { label: 'Below Pass', key: 'fail' };
}

export default function GPADashboard() {
  const [activeTab, setActiveTab] = useState(() => loadFromStorage(STORAGE_KEY_TAB, 'calculator'));
  const [courses, setCourses] = useState(() => loadFromStorage(STORAGE_KEY_COURSES, DEFAULT_COURSES));
  const [targets, setTargets] = useState(() => loadFromStorage(STORAGE_KEY_TARGETS, DEFAULT_TARGETS));
  const newModuleRef = useRef(null);

  /* Persist to localStorage on changes */
  useEffect(() => { saveToStorage(STORAGE_KEY_COURSES, courses); }, [courses]);
  useEffect(() => { saveToStorage(STORAGE_KEY_TARGETS, targets); }, [targets]);
  useEffect(() => { saveToStorage(STORAGE_KEY_TAB, activeTab); }, [activeTab]);

  /* Memoized GPA calculations — only recompute when data actually changes */
  const gpaVal = useMemo(() => {
    let totalCredits = 0;
    let totalPoints = 0;
    courses.forEach(course => {
      const credits = Number(course.credits);
      if (credits > 0 && gradePoints[course.grade] !== undefined) {
        totalCredits += credits;
        totalPoints += credits * gradePoints[course.grade];
      }
    });
    return totalCredits === 0 ? '0.00' : (totalPoints / totalCredits).toFixed(2);
  }, [courses]);

  const wgpaVal = useMemo(() => {
    const y2Avg = (Number(targets.y2s1) + Number(targets.y2s2)) / 2;
    const y3Avg = (Number(targets.y3s1) + Number(targets.y3s2)) / 2;
    const y4Avg = (Number(targets.y4s1) + Number(targets.y4s2)) / 2;
    const wgpa = (y2Avg * 0.20) + (y3Avg * 0.30) + (y4Avg * 0.50);
    return wgpa.toFixed(2);
  }, [targets]);

  /* Dynamic document title */
  useEffect(() => {
    const val = activeTab === 'calculator' ? gpaVal : wgpaVal;
    document.title = `GPA: ${val} — GPA Calculator`;
  }, [gpaVal, wgpaVal, activeTab]);



  /* Handlers with useCallback to avoid unnecessary child re-renders */
  const handleAddCourse = useCallback(() => {
    const newId = Date.now();
    setCourses(prev => [...prev, { id: newId, name: '', credits: 3, grade: 'A' }]);
    // Focus the new module's name input after render
    setTimeout(() => {
      if (newModuleRef.current) {
        newModuleRef.current.focus();
      }
    }, 50);
  }, []);

  const handleRemoveCourse = useCallback((id) => {
    setCourses(prev => prev.length > 1 ? prev.filter(c => c.id !== id) : prev);
  }, []);

  const handleCourseChange = useCallback((id, field, value) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== id) return c;
      // Validate credits: clamp between 1 and 8
      if (field === 'credits') {
        const num = Number(value);
        if (value === '') return { ...c, credits: '' };
        if (isNaN(num) || num < 1) return { ...c, credits: 1 };
        if (num > 8) return { ...c, credits: 8 };
        return { ...c, credits: Math.floor(num) };
      }
      return { ...c, [field]: value };
    }));
  }, []);

  const handleTargetChange = useCallback((sem, value) => {
    setTargets(prev => ({ ...prev, [sem]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setCourses(DEFAULT_COURSES);
    setTargets(DEFAULT_TARGETS);
  }, []);

  /* Export as text */
  const handleExport = useCallback(() => {
    const lines = [];
    lines.push('=== GPA Calculator Report ===');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('');

    lines.push('--- Semester GPA ---');
    courses.forEach((c, i) => {
      lines.push(`  ${i + 1}. ${c.name || 'Unnamed'} | Credits: ${c.credits} | Grade: ${c.grade} | Points: ${gradePoints[c.grade]}`);
    });
    lines.push(`  Semester GPA: ${gpaVal} (${getDegreeClass(gpaVal).label})`);
    lines.push('');

    lines.push('--- WGPA Target ---');
    lines.push(`  Y2 S1: ${Number(targets.y2s1).toFixed(2)} | Y2 S2: ${Number(targets.y2s2).toFixed(2)}`);
    lines.push(`  Y3 S1: ${Number(targets.y3s1).toFixed(2)} | Y3 S2: ${Number(targets.y3s2).toFixed(2)}`);
    lines.push(`  Y4 S1: ${Number(targets.y4s1).toFixed(2)} | Y4 S2: ${Number(targets.y4s2).toFixed(2)}`);
    lines.push(`  Estimated WGPA: ${wgpaVal} (${getDegreeClass(wgpaVal).label})`);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gpa-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [courses, gpaVal, targets, wgpaVal]);

  const getGPAColor = (gpa) => {
    const val = parseFloat(gpa);
    if (val >= 3.70) return { bg: '#dafbe1', border: '#aceebb', text: '#1a7f37' };
    if (val >= 3.00) return { bg: '#ddf4ff', border: '#b6e3ff', text: '#0969da' };
    if (val >= 2.00) return { bg: '#fff8c5', border: '#eac54f', text: '#9a6700' };
    return { bg: '#ffebe9', border: '#ffcecb', text: '#d1242f' };
  };

  /* Total credits/points for summary */
  const { totalCredits, totalPoints } = useMemo(() => {
    let tc = 0, tp = 0;
    courses.forEach(c => {
      const cr = Number(c.credits);
      if (cr > 0 && gradePoints[c.grade] !== undefined) {
        tc += cr;
        tp += cr * gradePoints[c.grade];
      }
    });
    return { totalCredits: tc, totalPoints: tp.toFixed(1) };
  }, [courses]);

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* Top nav bar */}
      <header
        style={{
          borderBottom: '1px solid #d1d9e0',
          backgroundColor: '#f6f8fa',
          padding: '12px 0',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GraduationCap style={{ width: '24px', height: '24px', color: '#1f2328' }} />
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#1f2328' }}>
              GPA Calculator
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleExport}
              title="Export Report"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#1f2328',
                backgroundColor: '#f6f8fa',
                border: '1px solid #d1d9e0',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <Download style={{ width: '14px', height: '14px' }} />
              Export
            </button>
            <button
              onClick={handleReset}
              title="Reset All Data"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#636c76',
                backgroundColor: '#f6f8fa',
                border: '1px solid #d1d9e0',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <RotateCcw style={{ width: '14px', height: '14px' }} />
              Reset
            </button>
          </div>
        </div>
      </header>

      <main style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '24px 16px',
      }}>

        {/* Tab buttons */}
        <div style={{
          display: 'flex',
          gap: '0',
          borderBottom: '1px solid #d1d9e0',
          marginBottom: '24px',
        }}>
          <button
            onClick={() => setActiveTab('calculator')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: activeTab === 'calculator' ? '#1f2328' : '#636c76',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'calculator' ? '2px solid #fd8c73' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Calculator style={{ width: '16px', height: '16px' }} />
            <span>Semester GPA</span>
          </button>
          <button
            onClick={() => setActiveTab('target')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: activeTab === 'target' ? '#1f2328' : '#636c76',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'target' ? '2px solid #fd8c73' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Target style={{ width: '16px', height: '16px' }} />
            <span>WGPA Target</span>
          </button>
        </div>

        {/* Tab 1: Semester GPA */}
        {activeTab === 'calculator' && (
          <div>
            <div style={{
              border: '1px solid #d1d9e0',
              borderRadius: '6px',
              overflow: 'hidden',
            }}>
              {/* Card header */}
              <div style={{
                padding: '16px',
                backgroundColor: '#f6f8fa',
                borderBottom: '1px solid #d1d9e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1f2328', margin: 0 }}>
                    Calculate Current Semester GPA
                  </h2>
                  <span style={{ fontSize: '12px', color: '#636c76' }}>
                    {courses.length} module{courses.length !== 1 ? 's' : ''} · {totalCredits} credits · {totalPoints} quality points
                  </span>
                </div>
                <button
                  onClick={handleAddCourse}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#ffffff',
                    backgroundColor: 'rgb(9, 105, 218)',
                    border: '1px solid rgba(27,31,36,0.15)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(10, 87, 175, 1)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(9, 105, 218)'}
                >
                  <Plus style={{ width: '14px', height: '14px' }} />
                  Add Module
                </button>
              </div>

              {/* Course rows */}
              <div>
                {courses.map((course, index) => (
                  <div
                    key={course.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderBottom: index < courses.length - 1 ? '1px solid #d1d9e0' : 'none',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f6f8fa',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#636c76',
                      minWidth: '20px',
                    }}>
                      {index + 1}.
                    </span>

                    <input
                      ref={index === courses.length - 1 ? newModuleRef : null}
                      type="text"
                      placeholder="Module Name"
                      value={course.name}
                      onChange={(e) => handleCourseChange(course.id, 'name', e.target.value)}
                      style={{
                        flex: '1 1 180px',
                        padding: '5px 12px',
                        fontSize: '14px',
                        border: '1px solid #d1d9e0',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        color: '#1f2328',
                        outline: 'none',
                        minWidth: '0',
                      }}
                      onFocus={e => e.target.style.borderColor = '#0969da'}
                      onBlur={e => e.target.style.borderColor = '#d1d9e0'}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#636c76', fontWeight: 500 }}>Credits</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={course.credits}
                        onChange={(e) => handleCourseChange(course.id, 'credits', e.target.value)}
                        style={{
                          width: '60px',
                          padding: '5px 8px',
                          fontSize: '14px',
                          border: '1px solid #d1d9e0',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          color: '#1f2328',
                          outline: 'none',
                          textAlign: 'center',
                        }}
                        onFocus={e => e.target.style.borderColor = '#0969da'}
                        onBlur={e => e.target.style.borderColor = '#d1d9e0'}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: '#636c76', fontWeight: 500 }}>Grade</label>
                      <select
                        value={course.grade}
                        onChange={(e) => handleCourseChange(course.id, 'grade', e.target.value)}
                        style={{
                          width: '72px',
                          padding: '5px 8px',
                          fontSize: '14px',
                          fontWeight: 600,
                          border: '1px solid #d1d9e0',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          color: '#1f2328',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                        onFocus={e => e.target.style.borderColor = '#0969da'}
                        onBlur={e => e.target.style.borderColor = '#d1d9e0'}
                      >
                        {Object.keys(gradePoints).map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    {/* Per-row grade point display */}
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#636c76',
                      fontFamily: 'monospace',
                      minWidth: '32px',
                      textAlign: 'right',
                    }}>
                      {gradePoints[course.grade]?.toFixed(1)}
                    </span>

                    <button
                      onClick={() => handleRemoveCourse(course.id)}
                      style={{
                        padding: '4px',
                        color: '#636c76',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: courses.length > 1 ? 'pointer' : 'not-allowed',
                        opacity: courses.length > 1 ? 1 : 0.4,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => { if (courses.length > 1) e.currentTarget.style.color = '#d1242f'; }}
                      onMouseLeave={e => e.currentTarget.style.color = '#636c76'}
                      title="Remove Module"
                    >
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* GPA Result */}
            <div style={{
              marginTop: '20px',
              border: `1px solid ${getGPAColor(gpaVal).border}`,
              borderRadius: '6px',
              backgroundColor: getGPAColor(gpaVal).bg,
              padding: '24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', color: '#636c76', fontWeight: 500, marginBottom: '4px' }}>
                Your Semester GPA
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: 700,
                color: getGPAColor(gpaVal).text,
                lineHeight: 1.2,
              }}>
                {gpaVal}
              </div>
              <div style={{
                marginTop: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: getGPAColor(gpaVal).text,
              }}>
                {getDegreeClass(gpaVal).label}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: WGPA Target */}
        {activeTab === 'target' && (
          <div>
            <div style={{
              border: '1px solid #d1d9e0',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '20px',
            }}>
              {/* Header */}
              <div style={{
                padding: '16px',
                backgroundColor: '#f6f8fa',
                borderBottom: '1px solid #d1d9e0',
              }}>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1f2328', margin: 0 }}>
                  Degree Class Target Planner
                </h2>
                <p style={{ fontSize: '12px', color: '#636c76', margin: '4px 0 0' }}>
                  Adjust your expected GPA for future semesters to see your final WGPA.
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Year 2', weight: '20%' },
                    { label: 'Year 3', weight: '30%' },
                    { label: 'Year 4', weight: '50%' },
                  ].map(item => (
                    <span key={item.label} style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      backgroundColor: '#ddf4ff',
                      color: '#0969da',
                      borderRadius: '20px',
                      border: '1px solid #b6e3ff',
                    }}>
                      {item.label}: {item.weight}
                    </span>
                  ))}
                </div>
              </div>

              {/* Year sections */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <YearSection
                  year="Year 2"
                  weight="20%"
                  sem1={{ key: 'y2s1', value: targets.y2s1 }}
                  sem2={{ key: 'y2s2', value: targets.y2s2 }}
                  onChange={handleTargetChange}
                />
                <YearSection
                  year="Year 3"
                  weight="30%"
                  sem1={{ key: 'y3s1', value: targets.y3s1 }}
                  sem2={{ key: 'y3s2', value: targets.y3s2 }}
                  onChange={handleTargetChange}
                />
                <YearSection
                  year="Year 4"
                  weight="50%"
                  sem1={{ key: 'y4s1', value: targets.y4s1 }}
                  sem2={{ key: 'y4s2', value: targets.y4s2 }}
                  onChange={handleTargetChange}
                />
              </div>
            </div>

            {/* WGPA Result */}
            <div style={{
              border: `1px solid ${getGPAColor(wgpaVal).border}`,
              borderRadius: '6px',
              backgroundColor: getGPAColor(wgpaVal).bg,
              padding: '24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', color: '#636c76', fontWeight: 500, marginBottom: '4px' }}>
                Estimated Final WGPA
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: 700,
                color: getGPAColor(wgpaVal).text,
                lineHeight: 1.2,
              }}>
                {wgpaVal}
              </div>
              <div style={{
                marginTop: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: getGPAColor(wgpaVal).text,
              }}>
                {getDegreeClass(wgpaVal).label}
              </div>
              {parseFloat(wgpaVal) >= 3.70 && (
                <div style={{
                  marginTop: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#1a7f37',
                  backgroundColor: '#dafbe1',
                  border: '1px solid #aceebb',
                  borderRadius: '20px',
                }}>
                  First Class Target Reached!
                </div>
              )}
            </div>
          </div>
        )}


      </main>


    </div>
  );
}



/* Reusable Year Section component */
const YearSection = React.memo(function YearSection({ year, weight, sem1, sem2, onChange }) {
  return (
    <div style={{
      border: '1px solid #d1d9e0',
      borderRadius: '6px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 16px',
        backgroundColor: '#f6f8fa',
        borderBottom: '1px solid #d1d9e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2328' }}>{year}</span>
        <span style={{ fontSize: '12px', color: '#636c76' }}>Weight: {weight}</span>
      </div>
      <div style={{
        padding: '16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        <SliderField label="Semester 1" value={sem1.value} onChange={(v) => onChange(sem1.key, v)} />
        <SliderField label="Semester 2" value={sem2.value} onChange={(v) => onChange(sem2.key, v)} />
      </div>
    </div>
  );
});

/* Reusable Slider component */
const SliderField = React.memo(function SliderField({ label, value, onChange }) {
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#636c76' }}>{label}</span>
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#1f2328',
          fontFamily: 'monospace',
        }}>
          {Number(value).toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min="2.00"
        max="4.00"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          accentColor: '#0969da',
          height: '6px',
          cursor: 'pointer',
        }}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: '#8b949e',
        marginTop: '2px',
      }}>
        <span>2.00</span>
        <span>4.00</span>
      </div>
    </div>
  );
});