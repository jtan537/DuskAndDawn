using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ThreeDMovementReg : MonoBehaviour
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
            Move();
        }
        else
        {
            anim.SetBool("isRunning", false);
        }

    }

    void Move()
    {

        float horizontal = Input.GetAxisRaw("Horizontal");
        float vertical = Input.GetAxisRaw("Vertical");
        Vector3 direction = new Vector3(horizontal, 0f, vertical).normalized;

        if (direction.magnitude >= 0.1f)
        {
            transform.position += direction * moveSpeed * Time.deltaTime;
        }

        anim.SetBool("isRunning", true);
    }
}


