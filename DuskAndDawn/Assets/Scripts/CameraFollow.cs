using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    // Start is called before the first frame update

    public Transform PlayerTransform;

    private Vector3 cameraOffset;
    [Range(0.01f, 1.0f)]
    public float SmoothFactor = 0.5f;

    public bool LookAtPlayer = false;
    public bool RotateAroundPlayer = true;

    // public float RotationSpeed = 5.0f;

    void Start()
    {
        cameraOffset = transform.position - PlayerTransform.position;

    }

    void LateUpdate()
    {
        // if (RotateAroundPlayer)
        // {
        //     Quaternion camTurnAngle = 
        //         Quaternion.AngleAxis(Input.GetAxis("Mouse X") * RotationSpeed, Vector3.up);

        //     cameraOffset = camTurnAngle * cameraOffset;
        // }
        Vector3 newPos = PlayerTransform.position + cameraOffset;

        transform.position = Vector3.Slerp(transform.position, newPos, SmoothFactor);

        // if(LookAtPlayer || RotateAroundPlayer)
        transform.LookAt(PlayerTransform);
    }
}