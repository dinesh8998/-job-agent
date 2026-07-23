import React, { useState } from 'react';
import { Typography, Upload, Button, message, Input, Spin, Divider } from 'antd';
import { InboxOutlined, PlusOutlined } from '@ant-design/icons';
import { FileCode, Sparkles, CheckCircle, Shield, FileText } from 'lucide-react';
import axios from 'axios';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';
import SkillBadge from '../components/SkillBadge';

const { Paragraph } = Typography;
const { Dragger } = Upload;

const UploadResume = () => {
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleClose = (removedSkill) => {
    setSkills(skills.filter((skill) => skill !== removedSkill));
  };

  const handleInputConfirm = () => {
    if (inputValue && skills.indexOf(inputValue) === -1) {
      setSkills([...skills, inputValue]);
    }
    setInputVisible(false);
    setInputValue('');
  };

  const handleUploadChange = (info) => {
    let newFileList = [...info.fileList].slice(-1);
    setFileList(newFileList);
    setUploadSuccess(false);
  };

  const dummyRequest = ({ file, onSuccess }) => {
    setTimeout(() => onSuccess("ok"), 0);
  };

  const processResume = async () => {
    if (fileList.length === 0) {
      message.warning('Please upload a resume first.');
      return;
    }

    setLoading(true);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('resume', fileList[0].originFileObj);

      try {
        const response = await axios.post('http://localhost:8000/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSkills(response.data.skills || ['JavaScript', 'React', 'Node.js']);
        setUploadSuccess(true);
        message.success('Resume processed successfully via API!');
      } catch (err) {
        console.warn('Backend unavailable, using mock data.');
        setTimeout(() => {
          setSkills(['Penetration Testing', 'Threat Intelligence', 'Network Security', 'Python', 'SIEM', 'Incident Response', 'Vulnerability Assessment']);
          setUploadSuccess(true);
          message.success('Resume mock processed successfully!');
          setLoading(false);
        }, 1200);
        return;
      }
    } catch (error) {
      message.error('Failed to process resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <PageHeader
        icon={FileCode}
        title="Analyze Resume"
        subtitle="Upload your resume and let AI extract your skills, experience, and qualifications."
      />

      {/* Upload Zone */}
      <GlassCard hoverable={false} style={{ marginBottom: 24 }}>
        <Dragger
          name="file"
          fileList={fileList}
          onChange={handleUploadChange}
          customRequest={dummyRequest}
          accept=".pdf,.docx,.doc"
          style={{
            padding: '40px 24px',
            background: 'rgba(0, 0, 0, 0.15)',
            borderRadius: 14,
            border: '2px dashed rgba(99, 102, 241, 0.2)',
            transition: 'all 250ms ease',
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 4,
            }}>
              <InboxOutlined style={{ fontSize: 28, color: '#6366f1' }} />
            </div>
            <p style={{ color: '#f0f2f8', fontSize: 15, fontWeight: 500, margin: 0 }}>
              Click or drag your resume here
            </p>
            <p style={{ color: '#5a6478', fontSize: 13, margin: 0 }}>
              Supports PDF and DOCX files up to 10MB
            </p>
          </div>
        </Dragger>

        {/* File Preview */}
        {fileList.length > 0 && (
          <div className="fade-in" style={{
            marginTop: 16,
            padding: '14px 18px',
            background: 'rgba(99, 102, 241, 0.06)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <FileText size={20} color="#6366f1" />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#f0f2f8' }}>
                {fileList[0].name}
              </p>
              <span style={{ fontSize: 12, color: '#5a6478' }}>
                {(fileList[0].size / 1024).toFixed(1)} KB
              </span>
            </div>
            {uploadSuccess && <CheckCircle size={18} color="#34d399" />}
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<Sparkles size={16} />}
            onClick={processResume}
            loading={loading}
            disabled={fileList.length === 0}
            style={{
              height: 48,
              padding: '0 32px',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {loading ? 'Analyzing...' : 'Process Resume'}
          </Button>
        </div>
      </GlassCard>

      {/* Loading State */}
      {loading && (
        <GlassCard hoverable={false} style={{ marginBottom: 24 }}>
          <div className="fade-in" style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="pulse-glow" style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Sparkles size={24} color="#6366f1" className="spin" />
            </div>
            <p style={{ color: '#8591a8', fontSize: 15, margin: 0 }}>
              AI is analyzing your resume...
            </p>
            <p style={{ color: '#5a6478', fontSize: 13, margin: '8px 0 0' }}>
              Extracting skills, experience, and qualifications
            </p>
          </div>
        </GlassCard>
      )}

      {/* Extracted Skills */}
      {skills.length > 0 && !loading && (
        <GlassCard hoverable={false}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(52, 211, 153, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Shield size={18} color="#34d399" />
            </div>
            <div>
              <h3 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: '#f0f2f8',
                margin: 0,
              }}>
                Extracted Skills
              </h3>
              <p style={{ fontSize: 13, color: '#5a6478', margin: 0 }}>
                {skills.length} skills identified
              </p>
            </div>
          </div>

          <Paragraph style={{ color: '#8591a8', fontSize: 13, marginBottom: 20 }}>
            Review and adjust the skills extracted from your resume. These will be used to match you with the best job opportunities.
          </Paragraph>

          <Divider style={{ borderColor: 'rgba(255,255,255,0.04)', margin: '16px 0 20px' }} />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {skills.map((skill, index) => (
              <SkillBadge
                key={skill}
                skill={skill}
                closable
                onClose={handleClose}
                delay={index * 60}
              />
            ))}
            {inputVisible ? (
              <Input
                type="text"
                size="small"
                style={{
                  width: 140,
                  borderRadius: 99,
                  background: 'transparent',
                  border: '1px dashed rgba(99,102,241,0.3)',
                  color: '#f0f2f8',
                  height: 32,
                }}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleInputConfirm}
                onPressEnter={handleInputConfirm}
                autoFocus
                placeholder="Type skill..."
              />
            ) : (
              <button
                onClick={() => setInputVisible(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 99,
                  border: '1px dashed rgba(255,255,255,0.15)',
                  background: 'transparent',
                  color: '#8591a8',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 200ms ease',
                }}
              >
                <PlusOutlined /> Add Skill
              </button>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default UploadResume;
