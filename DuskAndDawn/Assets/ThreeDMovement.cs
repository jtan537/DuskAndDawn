using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ThreeDMovement : MonoBehaviour
{
    [SerializeField]
    float moveSpeed = 4f;
    float jumpForce;

    Vector3 forward, right;
    public Rigidbody theRB;

    private Vector2 moveInput;



    public Animator anim;

    private void Update()
    {


        if (Input.anyKey)
        {
            updateMovementDirection();
            Move();
        }
        else
        {
            anim.SetBool("isRunning", false);
        }

    }

    void updateMovementDirection()
    {
        forward = Camera.main.transform.forward;
        forward.y = 0;
        forward = Vector3.Normalize(forward);
        right = Quaternion.Euler(new Vector3(0, 90, 0)) * forward;
    }

    void Move()
    {
        
        Vector3 rightMovement = right * moveSpeed * Time.deltaTime * Input.GetAxisRaw("HorizontalKey");
        Vector3 upMovement = forward * moveSpeed * Time.deltaTime * Input.GetAxisRaw("VerticalKey");

        Vector3 overallMovement = Vector3.Normalize(rightMovement + upMovement);
        transform.forward = overallMovement;
        transform.position += rightMovement;
        transform.position += upMovement;
        anim.SetBool("isRunning", true);
    }
}
    

